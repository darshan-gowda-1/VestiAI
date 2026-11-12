from io import BytesIO
import uuid

from httpx import ASGITransport, AsyncClient
from PIL import Image
import pytest
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token, hash_password
from app.db.base import Base, utc_now
from app.db.session import get_db
from app.main import app
from app.models.product import Product
from app.models.tryon_job import TryOnJob
from app.models.user import User
from app.services.catalog_service import CatalogService
from app.workers.queue import job_queue


def _png_bytes(color: tuple[int, int, int] = (140, 160, 180)) -> bytes:
    buf = BytesIO()
    Image.new("RGB", (256, 256), color=color).save(buf, format="PNG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_v2_catalog_history_retry_and_extension_endpoints(tmp_path, monkeypatch):
    job_queue.clear_memory()
    monkeypatch.setattr("app.core.config.settings.LOCAL_STORAGE_PATH", str(tmp_path))
    monkeypatch.setattr("app.core.config.settings.STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.core.config.settings.WORKER_AUTO_DISPATCH", False)

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        await CatalogService.seed_sample_catalog(db)
        product = (await db.execute(select(Product).limit(1))).scalar_one()
        user = User(email="v2ext@example.com", password_hash=hash_password("Pass1234!"), role="user")
        db.add(user)
        await db.commit()
        await db.refresh(user)

        failed_job = TryOnJob(
            user_id=user.id,
            product_id=product.id,
            status="failed",
            person_image_key="uploads/p.png",
            garment_image_key=product.tryon_image_key,
            category="upper_body",
            consent_at=utc_now(),
            model_name="stub",
            error_code="REMOTE_ERROR",
            error_message="Temporary error",
        )
        db.add(failed_job)
        await db.commit()
        await db.refresh(failed_job)

    token, _, _ = create_access_token(user.id, "user")
    headers = {"Authorization": f"Bearer {token}"}

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # 1. Categories & Product search
            cat_resp = await client.get("/api/v1/categories")
            assert cat_resp.status_code == 200
            assert len(cat_resp.json()) == 4

            search_resp = await client.get("/api/v1/products/search?q=Navy")
            assert search_resp.status_code == 200
            assert search_resp.json()["meta"]["total"] >= 1

            # 2. History endpoint
            hist_resp = await client.get("/api/v1/history", headers=headers)
            assert hist_resp.status_code == 200
            assert len(hist_resp.json()["items"]) == 1

            # 3. Retry failed job -> 202 queued; retrying queued job -> 409
            retry_resp = await client.post(f"/api/v1/tryon/jobs/{failed_job.id}/retry", headers=headers)
            assert retry_resp.status_code == 202
            assert retry_resp.json()["status"] == "queued"

            retry_again = await client.post(f"/api/v1/tryon/jobs/{failed_job.id}/retry", headers=headers)
            assert retry_again.status_code == 409

            # 4. Extension session & product validation
            sess_resp = await client.post("/api/v1/extension/session", headers=headers)
            assert sess_resp.status_code == 200
            assert sess_resp.json()["authenticated"] is True
            assert sess_resp.json()["api_version"] == "2.0"

            bad_prod = await client.post(
                "/api/v1/extension/product",
                headers=headers,
                json={"image_url": "javascript:alert(1)", "page_url": "https://shop.example.com/item"},
            )
            assert bad_prod.status_code == 422

            good_prod = await client.post(
                "/api/v1/extension/product",
                headers=headers,
                json={
                    "image_url": "https://cdn.example.com/shirt.jpg",
                    "page_url": "https://shop.example.com/products/oxford-shirt",
                    "title": "Oxford Shirt",
                },
            )
            assert good_prod.status_code == 200
            assert good_prod.json()["retailer_domain"] == "shop.example.com"

            # 5. Extension try-on submission
            ext_tryon = await client.post(
                "/api/v1/extension/tryon",
                headers=headers,
                data={
                    "consent": "true",
                    "category": "upper_body",
                    "retailer_url": "https://shop.example.com/products/oxford-shirt",
                    "product_title": "Oxford Shirt",
                },
                files={
                    "person_image": ("person.png", _png_bytes((200, 170, 150)), "image/png"),
                    "garment_image": ("garment.png", _png_bytes((50, 80, 120)), "image/png"),
                },
            )
            assert ext_tryon.status_code == 202
            assert uuid.UUID(ext_tryon.json()["job_id"])
            assert ext_tryon.json()["status"] == "queued"
    finally:
        app.dependency_overrides.clear()
        await engine.dispose()
