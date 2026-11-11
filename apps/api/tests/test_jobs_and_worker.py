from datetime import timedelta
from io import BytesIO
import os

from PIL import Image
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.ai.adapter import StubTryOnModel, TryOnOOMError, TryOnTimeoutError
from app.core.exceptions import ConflictError
from app.core.security import create_access_token, hash_password
from app.db.base import Base, utc_now
from app.db.session import get_db
from app.main import app
from app.models.consent_record import ConsentRecord
from app.models.product import Product
from app.models.tryon_job import TryOnJob
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.services.catalog_service import CatalogService
from app.services.storage_service import LocalStorageBackend
from app.services.tryon_service import validate_job_transition
from app.workers.queue import job_queue
from app.workers.tryon_worker import process_single_job, run_worker_once

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "test_data")


def _png_bytes(width: int = 300, height: int = 400) -> bytes:
    buf = BytesIO()
    Image.new("RGB", (width, height), color=(180, 150, 130)).save(buf, format="PNG")
    return buf.getvalue()


@pytest_asyncio.fixture
async def worker_env(tmp_path, monkeypatch):
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

    # Store garment image fixture for seeded product
    with open(os.path.join(FIXTURES_DIR, "garment_01.png"), "rb") as f:
        garment_bytes = f.read()

    async with session_factory() as db:
        await CatalogService.seed_sample_catalog(db)
        product = (await db.execute(select(Product).limit(1))).scalar_one()
        storage.put_object(product.tryon_image_key, garment_bytes, "image/png")

        user_a = User(email="usera@jobs.test", password_hash=hash_password("Pass1234!"), role="user")
        user_b = User(email="userb@jobs.test", password_hash=hash_password("Pass1234!"), role="user")
        db.add_all([user_a, user_b])
        await db.commit()
        await db.refresh(user_a)
        await db.refresh(user_b)

    token_a, _, _ = create_access_token(user_a.id, "user")
    token_b, _, _ = create_access_token(user_b.id, "user")

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client, session_factory, storage, product, user_a, user_b, token_a, token_b

    app.dependency_overrides.clear()
    job_queue.clear_memory()
    await engine.dispose()


@pytest.mark.asyncio
async def test_job_creation_validation_and_duplicate_prevention(worker_env):
    client, session_factory, _, product, _, _, token_a, _ = worker_env
    headers = {"Authorization": f"Bearer {token_a}"}
    img = _png_bytes()

    # Unauthenticated rejected
    unauth = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p.png", img, "image/png")},
        data={"product_id": str(product.id), "consent": "true"},
    )
    assert unauth.status_code == 401

    # Missing consent rejected
    no_consent = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p.png", img, "image/png")},
        data={"product_id": str(product.id), "consent": "false"},
        headers=headers,
    )
    assert no_consent.status_code == 422
    assert no_consent.json()["code"] == "CONSENT_REQUIRED"

    # Unsupported category rejected
    bad_cat = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p.png", img, "image/png")},
        data={"product_id": str(product.id), "consent": "true", "category": "boots"},
        headers=headers,
    )
    assert bad_cat.status_code == 422
    assert bad_cat.json()["code"] == "UNSUPPORTED_CATEGORY"

    # Valid submission creates queued job + consent record
    res1 = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p.png", img, "image/png")},
        data={"product_id": str(product.id), "consent": "true", "category": "upper_body"},
        headers={**headers, "Idempotency-Key": "dedup-req-1"},
    )
    assert res1.status_code == 202
    job_id_1 = res1.json()["job_id"]
    assert res1.json()["status"] == "queued"

    # Duplicate submission with same Idempotency-Key returns same job_id
    res2 = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p.png", img, "image/png")},
        data={"product_id": str(product.id), "consent": "true", "category": "upper_body"},
        headers={**headers, "Idempotency-Key": "dedup-req-1"},
    )
    assert res2.status_code == 202
    assert res2.json()["job_id"] == job_id_1

    # Duplicate content hash without Idempotency-Key also prevents duplicate queue entry
    res3 = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p.png", img, "image/png")},
        data={"product_id": str(product.id), "consent": "true", "category": "upper_body"},
        headers=headers,
    )
    assert res3.status_code == 202
    assert res3.json()["job_id"] == job_id_1

    async with session_factory() as db:
        consents = (await db.execute(select(ConsentRecord))).scalars().all()
        assert len(consents) == 1


@pytest.mark.asyncio
async def test_worker_processes_queued_job_ownership_and_deletion(worker_env):
    client, session_factory, storage, product, _, _, token_a, token_b = worker_env
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    with open(os.path.join(FIXTURES_DIR, "person_01.png"), "rb") as f:
        person_bytes = f.read()

    create_res = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("person.png", person_bytes, "image/png")},
        data={"product_id": str(product.id), "consent": "true", "category": "upper_body"},
        headers=headers_a,
    )
    assert create_res.status_code == 202
    job_id = create_res.json()["job_id"]

    # Before worker runs: queued, no result_url
    pre_status = await client.get(f"/api/v1/tryon/jobs/{job_id}", headers=headers_a)
    assert pre_status.status_code == 200
    assert pre_status.json()["status"] == "queued"
    assert pre_status.json()["result_url"] is None

    # Cross-user access blocked
    idor_get = await client.get(f"/api/v1/tryon/jobs/{job_id}", headers=headers_b)
    assert idor_get.status_code == 403
    idor_del = await client.delete(f"/api/v1/tryon/jobs/{job_id}", headers=headers_b)
    assert idor_del.status_code == 403

    # Worker claims and completes job
    final_status = await run_worker_once(
        session_factory=session_factory,
        model=StubTryOnModel(),
        storage=storage,
    )
    assert final_status == "completed"

    # After worker runs: completed with signed result_url
    post_status = await client.get(f"/api/v1/tryon/jobs/{job_id}", headers=headers_a)
    assert post_status.status_code == 200
    body = post_status.json()
    assert body["status"] == "completed"
    assert body["result_url"].startswith("/api/v1/media/signed")
    assert body["processing_time_ms"] > 0

    # Signed result URL yields valid PNG image
    img_res = await client.get(body["result_url"])
    assert img_res.status_code == 200
    decoded = Image.open(BytesIO(img_res.content))
    assert decoded.size == (768, 1024)

    # Check paginated list
    list_res = await client.get("/api/v1/tryon/jobs", headers=headers_a)
    assert list_res.status_code == 200
    assert list_res.json()["meta"]["total"] == 1

    # Grab object keys before deletion
    async with session_factory() as db:
        db_job = (await db.execute(select(TryOnJob))).scalar_one()
        p_key = db_job.person_image_key
        r_key = db_job.result_image_key

    assert storage.exists(p_key)
    assert storage.exists(r_key)

    # Delete job removes metadata AND private stored media files
    del_res = await client.delete(f"/api/v1/tryon/jobs/{job_id}", headers=headers_a)
    assert del_res.status_code == 204
    assert not storage.exists(p_key)
    assert not storage.exists(r_key)


@pytest.mark.asyncio
async def test_job_cancellation_and_state_transitions(worker_env):
    client, session_factory, storage, product, _, _, token_a, _ = worker_env
    headers_a = {"Authorization": f"Bearer {token_a}"}

    create_res = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p.png", _png_bytes(), "image/png")},
        data={"product_id": str(product.id), "consent": "true"},
        headers=headers_a,
    )
    job_id = create_res.json()["job_id"]

    # Cancel queued job
    cancel_res = await client.post(f"/api/v1/tryon/jobs/{job_id}/cancel", headers=headers_a)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Cancelling again yields 409 CONFLICT
    cancel_again = await client.post(f"/api/v1/tryon/jobs/{job_id}/cancel", headers=headers_a)
    assert cancel_again.status_code == 409

    # Worker skips cancelled job cleanly
    worker_status = await run_worker_once(
        session_factory=session_factory,
        model=StubTryOnModel(),
        storage=storage,
    )
    assert worker_status == "cancelled"

    # Transition validator check
    validate_job_transition("queued", "processing")
    with pytest.raises(ConflictError):
        validate_job_transition("completed", "queued")


@pytest.mark.asyncio
async def test_worker_retries_oom_and_crash_recovery(worker_env):
    client, session_factory, storage, product, user_a, _, token_a, _ = worker_env
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 1. Recoverable timeout succeeds on retry #2
    res1 = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p1.png", _png_bytes(301, 400), "image/png")},
        data={"product_id": str(product.id), "consent": "true"},
        headers=headers_a,
    )
    job_retry_id = res1.json()["job_id"]

    class FlakyModel(StubTryOnModel):
        def __init__(self):
            super().__init__()
            self.calls = 0

        def generate(self, person_image, garment_image, category, settings=None):
            self.calls += 1
            if self.calls == 1:
                raise TryOnTimeoutError(1.0)
            return super().generate(person_image, garment_image, category, settings)

    flaky = FlakyModel()
    import uuid as uuid_mod
    status_after_retry = await process_single_job(
        uuid_mod.UUID(job_retry_id),
        session_factory=session_factory,
        model=flaky,
        storage=storage,
        max_retries=2,
        retry_delay_sec=0.01,
    )
    assert status_after_retry == "completed"
    assert flaky.calls == 2

    # 2. Non-recoverable OOM fails immediately with GPU_OUT_OF_MEMORY
    res2 = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p2.png", _png_bytes(302, 400), "image/png")},
        data={"product_id": str(product.id), "consent": "true"},
        headers=headers_a,
    )
    job_oom_id = res2.json()["job_id"]

    class OOMModel(StubTryOnModel):
        def generate(self, person_image, garment_image, category, settings=None):
            raise TryOnOOMError("Simulated VRAM exhaustion")

    oom_status = await process_single_job(
        uuid_mod.UUID(job_oom_id),
        session_factory=session_factory,
        model=OOMModel(),
        storage=storage,
        max_retries=2,
        retry_delay_sec=0.01,
    )
    assert oom_status == "failed"

    oom_detail = await client.get(f"/api/v1/tryon/jobs/{job_oom_id}", headers=headers_a)
    assert oom_detail.json()["error_code"] == "GPU_OUT_OF_MEMORY"

    # 3. Worker crash recovery marks stale 'processing' job as WORKER_CRASH_RECOVERED
    async with session_factory() as db:
        stale_job = TryOnJob(
            user_id=user_a.id,
            product_id=product.id,
            status="processing",
            person_image_key="user-uploads/stale.png",
            garment_image_key=product.tryon_image_key,
            category="upper_body",
            consent_at=utc_now(),
            started_at=utc_now() - timedelta(minutes=15),
        )
        db.add(stale_job)
        await db.commit()
        stale_id = stale_job.id

        recovered = await JobRepository.recover_stale_processing_jobs(db, stale_after_seconds=300)
        assert recovered == 1

        refreshed = await JobRepository.get_by_id(db, stale_id)
        assert refreshed.status == "failed"
        assert refreshed.error_code == "WORKER_CRASH_RECOVERED"
