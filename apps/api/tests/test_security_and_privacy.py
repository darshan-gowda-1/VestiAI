from io import BytesIO
from PIL import Image
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.logging import redact_sensitive_text
from app.core.rate_limit import rate_limiter
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app, lifespan
from app.models.product import Product
from app.models.user import User
from app.services.catalog_service import CatalogService


def _png_bytes() -> bytes:
    buf = BytesIO()
    Image.new("RGB", (256, 256), color=(110, 130, 150)).save(buf, format="PNG")
    return buf.getvalue()


@pytest_asyncio.fixture
async def security_client(tmp_path, monkeypatch):
    rate_limiter.clear_memory()
    monkeypatch.setattr("app.core.config.settings.LOCAL_STORAGE_PATH", str(tmp_path))
    monkeypatch.setattr("app.core.config.settings.STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.core.config.settings.RATE_LIMIT_ENABLED", True)

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
        user = User(email="sec@vestiai.edu", password_hash=hash_password("Pass1234!"), role="user")
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token, _, _ = create_access_token(user.id, "user")

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client, product, token

    app.dependency_overrides.clear()
    rate_limiter.clear_memory()
    await engine.dispose()


@pytest.mark.asyncio
async def test_security_headers_and_log_redaction(security_client):
    client, _, _ = security_client
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["x-frame-options"] == "DENY"
    assert res.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "permissions-policy" in res.headers

    raw_log = "GET /api/v1/media/signed?key=u/a.png&expires=9999&sig=supersecret123&token=jwt999"
    redacted = redact_sensitive_text(raw_log)
    assert "supersecret123" not in redacted
    assert "jwt999" not in redacted
    assert "sig=[REDACTED]" in redacted


@pytest.mark.asyncio
async def test_rate_limiting_enforced_on_auth_and_tryon(security_client, monkeypatch):
    client, product, token = security_client
    monkeypatch.setattr("app.core.config.settings.RATE_LIMIT_AUTH_PER_MINUTE", 2)
    monkeypatch.setattr("app.core.config.settings.RATE_LIMIT_TRYON_PER_MINUTE", 1)

    # First 2 login requests succeed/fail normally; 3rd triggers 429
    for _ in range(2):
        r = await client.post(
            "/api/v1/auth/login",
            json={"email": "sec@vestiai.edu", "password": "wrong-password"},
        )
        assert r.status_code == 401

    limited_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "sec@vestiai.edu", "password": "wrong-password"},
    )
    assert limited_login.status_code == 429
    assert limited_login.json()["code"] == "RATE_LIMIT_EXCEEDED"
    assert "retry-after" in limited_login.headers

    # Try-on rate limit (1/min)
    headers = {"Authorization": f"Bearer {token}"}
    first_tryon = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p.png", _png_bytes(), "image/png")},
        data={"product_id": str(product.id), "consent": "true"},
        headers=headers,
    )
    assert first_tryon.status_code == 202

    second_tryon = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p2.png", _png_bytes(), "image/png")},
        data={"product_id": str(product.id), "consent": "true"},
        headers=headers,
    )
    assert second_tryon.status_code == 429
    assert second_tryon.json()["code"] == "RATE_LIMIT_EXCEEDED"


@pytest.mark.asyncio
async def test_consent_audit_endpoint_and_private_path_blocking(security_client):
    client, product, token = security_client
    headers = {"Authorization": f"Bearer {token}"}

    # Submit try-on job with consent
    job_res = await client.post(
        "/api/v1/tryon/jobs",
        files={"person_image": ("p.png", _png_bytes(), "image/png")},
        data={"product_id": str(product.id), "consent": "true"},
        headers=headers,
    )
    assert job_res.status_code == 202

    # Consent endpoint lists the recorded consent
    consents_res = await client.get("/api/v1/users/me/consents", headers=headers)
    assert consents_res.status_code == 200
    consents = consents_res.json()
    assert len(consents) == 1
    assert consents[0]["purpose"] == "2d_virtual_tryon_processing"

    # Attempt path traversal via public catalog route
    traversal = await client.get("/api/v1/media/catalog/..%2Fuser-uploads%2Fsecret.png")
    assert traversal.status_code in (403, 404)


@pytest.mark.asyncio
async def test_production_rejects_default_secret_key(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.ENVIRONMENT", "production")
    monkeypatch.setattr(
        "app.core.config.settings.AUTH_SECRET_KEY",
        "change_this_to_a_secure_random_secret_key_in_production",
    )
    with pytest.raises(RuntimeError, match="AUTH_SECRET_KEY"):
        async with lifespan(app):
            pass

