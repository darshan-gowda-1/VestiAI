from io import BytesIO
import os
import uuid

from httpx import ASGITransport, AsyncClient
from PIL import Image
import pytest
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.ai.adapter import StubTryOnModel
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.product import Product
from app.models.user import User
from app.services.catalog_service import CatalogService
from app.services.storage_service import LocalStorageBackend
from app.workers.queue import job_queue
from app.workers.tryon_worker import process_single_job

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "test_data")


def _make_jpeg_bytes(width: int, height: int, color: tuple[int, int, int]) -> bytes:
    img = Image.new("RGB", (width, height), color)
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_webcam_jpeg_capture_runs_through_ai_pipeline_and_records_model_version(
    tmp_path,
    monkeypatch,
):
    """
    Phase 6 verification (V2-TASK-44..54):
    Submit a 640x480 webcam-style JPEG capture with consent, execute the AI worker,
    and verify real output image generation, model_name versioning, and timing metrics.
    """
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
        product = (await db.execute(select(Product).limit(1))).scalar_one()
        storage.put_object(product.tryon_image_key, garment_bytes, "image/png")

        user = User(email="camuser@vestiai.test", password_hash=hash_password("Pass1234!"), role="user")
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token, _, _ = create_access_token(user.id, "user")
    headers = {"Authorization": f"Bearer {token}"}

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            webcam_jpeg = _make_jpeg_bytes(640, 480, (185, 160, 145))

            create_resp = await client.post(
                "/api/v1/tryon/jobs",
                headers=headers,
                data={
                    "product_id": str(product.id),
                    "consent": "true",
                    "category": "upper_body",
                },
                files={"person_image": ("vestiai-capture-1700000000.jpg", webcam_jpeg, "image/jpeg")},
            )
            assert create_resp.status_code == 202
            job_id = create_resp.json()["job_id"]

            final_status = await process_single_job(
                job_id=uuid.UUID(job_id),
                session_factory=session_factory,
                model=StubTryOnModel(),
                storage=storage,
            )
            assert final_status == "completed"

            status_resp = await client.get(f"/api/v1/tryon/jobs/{job_id}", headers=headers)
            assert status_resp.status_code == 200
            payload = status_resp.json()
            assert payload["status"] == "completed"
            assert payload["model_name"] == "deterministic-test-stub"
            assert payload["processing_time_ms"] is not None and payload["processing_time_ms"] >= 0
            assert payload["result_url"]

            media_resp = await client.get(payload["result_url"])
            assert media_resp.status_code == 200
            assert media_resp.headers["content-type"].startswith("image/png")
            out_img = Image.open(BytesIO(media_resp.content))
            assert out_img.size[0] >= 512 and out_img.size[1] >= 512
    finally:
        app.dependency_overrides.clear()
        await engine.dispose()
