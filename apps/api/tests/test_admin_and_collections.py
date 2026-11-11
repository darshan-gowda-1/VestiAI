from io import BytesIO
import os

from PIL import Image
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
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
from app.workers.tryon_worker import run_worker_once

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "test_data")


def _png_bytes() -> bytes:
    buf = BytesIO()
    Image.new("RGB", (300, 400), color=(140, 160, 180)).save(buf, format="PNG")
    return buf.getvalue()


@pytest_asyncio.fixture
async def admin_env(tmp_path, monkeypatch):
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

        user_a = User(email="a@admin-test.edu", password_hash=hash_password("Pass1234!"), role="user")
        user_b = User(email="b@admin-test.edu", password_hash=hash_password("Pass1234!"), role="user")
        admin = User(email="admin@admin-test.edu", password_hash=hash_password("Pass1234!"), role="admin")
        db.add_all([user_a, user_b, admin])
        await db.commit()
        await db.refresh(user_a)
        await db.refresh(user_b)
        await db.refresh(admin)

    token_a, _, _ = create_access_token(user_a.id, "user")
    token_b, _, _ = create_access_token(user_b.id, "user")
    token_admin, _, _ = create_access_token(admin.id, "admin")

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client, session_factory, storage, product, token_a, token_b, token_admin

    app.dependency_overrides.clear()
    job_queue.clear_memory()
    await engine.dispose()


@pytest.mark.asyncio
async def test_admin_security_guards_across_all_admin_endpoints(admin_env):
    client, _, _, _, token_a, _, _ = admin_env
    user_headers = {"Authorization": f"Bearer {token_a}"}

    endpoints = [
        ("GET", "/api/v1/admin/products"),
        ("GET", "/api/v1/admin/jobs"),
        ("GET", "/api/v1/admin/stats"),
        ("GET", "/api/v1/admin/audit-logs"),
    ]
    for method, path in endpoints:
        unauth = await client.request(method, path)
        assert unauth.status_code == 401
        forbidden = await client.request(method, path, headers=user_headers)
        assert forbidden.status_code == 403


@pytest.mark.asyncio
async def test_admin_monitoring_stats_audit_and_minimal_pii(admin_env):
    client, session_factory, storage, product, token_a, _, token_admin = admin_env
    user_headers = {"Authorization": f"Bearer {token_a}"}
    admin_headers = {"Authorization": f"Bearer {token_admin}"}

    # Submit and process one try-on job
    with open(os.path.join(FIXTURES_DIR, "person_01.png"), "rb") as f:
        person_bytes = f.read()

    job_res = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p.png", person_bytes, "image/png")},
        data={"product_id": str(product.id), "consent": "true"},
        headers=user_headers,
    )
    assert job_res.status_code == 202
    job_id = job_res.json()["job_id"]

    await run_worker_once(session_factory=session_factory, model=StubTryOnModel(), storage=storage)
    await client.post("/api/v1/saved-looks", json={"job_id": job_id}, headers=user_headers)

    # Admin updates product
    patch_res = await client.patch(
        f"/api/v1/admin/products/{product.id}",
        json={"price": "49.00"},
        headers=admin_headers,
    )
    assert patch_res.status_code == 200

    # Admin job monitor exposes minimal data (no user_id, no person/result keys or URLs)
    jobs_res = await client.get("/api/v1/admin/jobs", headers=admin_headers)
    assert jobs_res.status_code == 200
    items = jobs_res.json()["items"]
    assert len(items) == 1
    job_summary = items[0]
    assert job_summary["status"] == "completed"
    for forbidden_key in ("user_id", "email", "person_image_key", "result_image_key", "person_image_url", "result_url"):
        assert forbidden_key not in job_summary

    # Admin usage stats match real DB state
    stats_res = await client.get("/api/v1/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_users"] == 3
    assert stats["active_products"] == 12
    assert stats["total_jobs"] == 1
    assert stats["completed_jobs"] == 1
    assert stats["total_saved_looks"] == 1
    assert stats["avg_processing_time_ms"] > 0

    # Admin audit logs recorded product update
    logs_res = await client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert logs_res.status_code == 200
    assert any(log["action"] == "UPDATE_PRODUCT" for log in logs_res.json()["items"])


@pytest.mark.asyncio
async def test_collections_ownership_and_bulk_user_purge(admin_env):
    client, _, _, product, token_a, token_b, _ = admin_env
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B submits a queued job
    b_job_res = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("pb.png", _png_bytes(), "image/png")},
        data={"product_id": str(product.id), "consent": "true"},
        headers=headers_b,
    )
    b_job_id = b_job_res.json()["job_id"]

    # User A cannot save User B's job
    cross_save = await client.post("/api/v1/saved-looks", json={"job_id": b_job_id}, headers=headers_a)
    assert cross_save.status_code == 403

    # User B cannot save a queued (incomplete) job
    queued_save = await client.post("/api/v1/saved-looks", json={"job_id": b_job_id}, headers=headers_b)
    assert queued_save.status_code == 409

    # User A submits two jobs and purges all of User A's jobs cleanly
    for _ in range(2):
        res = await client.post(
            "/api/v1/tryon/jobs",
            files={"person_image": ("pa.png", _png_bytes(), "image/png")},
            data={"product_id": str(product.id), "consent": "true"},
            headers=headers_a,
        )
        assert res.status_code == 202

    purge_res = await client.delete("/api/v1/tryon/jobs", headers=headers_a)
    assert purge_res.status_code == 200
    assert purge_res.json()["deleted_jobs"] >= 1

    a_hist = await client.get("/api/v1/tryon/jobs", headers=headers_a)
    assert a_hist.json()["meta"]["total"] == 0

    # User B's job remains intact
    b_hist = await client.get("/api/v1/tryon/jobs", headers=headers_b)
    assert b_hist.json()["meta"]["total"] == 1
