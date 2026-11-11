from io import BytesIO
import os

from PIL import Image
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.ai.adapter import StubTryOnModel
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.product import Product
from app.services.catalog_service import CatalogService
from app.services.storage_service import LocalStorageBackend
from app.workers.queue import job_queue
from app.workers.tryon_worker import run_worker_once

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "test_data")


@pytest_asyncio.fixture
async def e2e_env(tmp_path, monkeypatch):
    job_queue.clear_memory()
    monkeypatch.setattr("app.core.config.settings.LOCAL_STORAGE_PATH", str(tmp_path))
    monkeypatch.setattr("app.core.config.settings.STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.core.config.settings.WORKER_AUTO_DISPATCH", False)
    monkeypatch.setattr("app.core.config.settings.MODEL_NAME", "stub")

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    storage = LocalStorageBackend(root_dir=str(tmp_path))

    with open(os.path.join(FIXTURES_DIR, "garment_01.png"), "rb") as f:
        garment_bytes = f.read()

    async with session_factory() as db:
        await CatalogService.seed_sample_catalog(db)
        products = (await db.execute(select(Product))).scalars().all()
        for p in products:
            storage.put_object(p.tryon_image_key, garment_bytes, "image/png")

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client, session_factory, storage

    app.dependency_overrides.clear()
    job_queue.clear_memory()
    await engine.dispose()


@pytest.mark.asyncio
async def test_complete_shopper_e2e_journey(e2e_env):
    client, session_factory, storage = e2e_env

    # 1. Register shopper
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "e2e_shopper@vestiai.edu",
            "password": "ShopperPass123!",
            "full_name": "E2E Shopper",
        },
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Browse catalog and fetch product detail
    cat_res = await client.get("/api/v1/products?limit=12")
    assert cat_res.status_code == 200
    items = cat_res.json()["items"]
    assert len(items) == 12
    product_id = items[0]["id"]

    detail_res = await client.get(f"/api/v1/products/{product_id}")
    assert detail_res.status_code == 200

    # 3. Wishlist add & verify
    wish_add = await client.post("/api/v1/wishlist", json={"product_id": product_id}, headers=headers)
    assert wish_add.status_code == 201
    wish_list = await client.get("/api/v1/wishlist", headers=headers)
    assert wish_list.status_code == 200
    assert any(w["product_id"] == product_id for w in wish_list.json())

    # 4. Upload person image & submit try-on request
    with open(os.path.join(FIXTURES_DIR, "person_01.png"), "rb") as f:
        person_bytes = f.read()

    job_res = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("person.png", person_bytes, "image/png")},
        data={"product_id": product_id, "consent": "true", "category": "upper_body"},
        headers=headers,
    )
    assert job_res.status_code == 202
    job_id = job_res.json()["job_id"]

    # 5. AI worker processes job
    worker_status = await run_worker_once(
        session_factory=session_factory,
        model=StubTryOnModel(),
        storage=storage,
    )
    assert worker_status == "completed"

    # 6. Poll completed job & fetch generated image via signed URL
    poll_res = await client.get(f"/api/v1/tryon/jobs/{job_id}", headers=headers)
    assert poll_res.status_code == 200
    job_data = poll_res.json()
    assert job_data["status"] == "completed"
    assert job_data["result_url"].startswith("/api/v1/media/signed")
    assert job_data["person_image_url"].startswith("/api/v1/media/signed")

    result_img_res = await client.get(job_data["result_url"])
    assert result_img_res.status_code == 200
    decoded = Image.open(BytesIO(result_img_res.content))
    assert decoded.size == (768, 1024)

    # 7. Save look to collection & verify
    save_res = await client.post("/api/v1/saved-looks", json={"job_id": job_id}, headers=headers)
    assert save_res.status_code == 201
    saved_list = await client.get("/api/v1/saved-looks", headers=headers)
    assert len(saved_list.json()) == 1

    # 8. History & clean deletion
    history_res = await client.get("/api/v1/tryon/jobs", headers=headers)
    assert history_res.json()["meta"]["total"] == 1

    del_res = await client.delete(f"/api/v1/tryon/jobs/{job_id}", headers=headers)
    assert del_res.status_code == 204
    saved_after_del = await client.get("/api/v1/saved-looks", headers=headers)
    assert len(saved_after_del.json()) == 0
