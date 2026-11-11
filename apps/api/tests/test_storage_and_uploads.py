from io import BytesIO
import os
import time
from urllib.parse import parse_qs, urlparse

from PIL import Image
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.exceptions import ForbiddenError
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User
from app.services.storage_service import LocalStorageBackend, sanitize_storage_key


def _make_png_bytes(width: int = 256, height: int = 256) -> bytes:
    buf = BytesIO()
    Image.new("RGB", (width, height), color=(200, 180, 160)).save(buf, format="PNG")
    return buf.getvalue()


@pytest_asyncio.fixture
async def storage_client(tmp_path, monkeypatch):
    monkeypatch.setattr("app.core.config.settings.LOCAL_STORAGE_PATH", str(tmp_path))
    monkeypatch.setattr("app.core.config.settings.STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.core.config.settings.UPLOAD_MAX_MB", 1)

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
        user = User(email="upload@vestiai.test", password_hash=hash_password("Pass1234!"), role="user")
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token, _, _ = create_access_token(user.id, "user")

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client, token, tmp_path

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_upload_validation_rejects_spoofed_tiny_and_oversized_files(storage_client):
    client, token, _ = storage_client
    headers = {"Authorization": f"Bearer {token}"}

    # Unauthenticated upload blocked
    unauth = await client.post(
        "/api/v1/media/uploads",
        files={"file": ("photo.png", _make_png_bytes(), "image/png")},
    )
    assert unauth.status_code == 401

    # Disguised executable/text claiming to be PNG
    spoofed = await client.post(
        "/api/v1/media/uploads",
        files={"file": ("evil.png", b"MZnot-a-real-png-binary", "image/png")},
        headers=headers,
    )
    assert spoofed.status_code == 422
    assert spoofed.json()["code"] == "CORRUPT_IMAGE"

    # Bad extension
    bad_ext = await client.post(
        "/api/v1/media/uploads",
        files={"file": ("script.svg", b"<svg></svg>", "image/png")},
        headers=headers,
    )
    assert bad_ext.status_code == 422
    assert bad_ext.json()["code"] == "INVALID_FILE_EXTENSION"

    # Too small dimensions
    tiny = await client.post(
        "/api/v1/media/uploads",
        files={"file": ("tiny.png", _make_png_bytes(32, 32), "image/png")},
        headers=headers,
    )
    assert tiny.status_code == 422
    assert tiny.json()["code"] == "IMAGE_TOO_SMALL"

    # Oversized payload (> 1 MB test cap)
    oversized = await client.post(
        "/api/v1/media/uploads",
        files={"file": ("big.png", b"\x89PNG" + (b"0" * (1024 * 1024 + 50)), "image/png")},
        headers=headers,
    )
    assert oversized.status_code == 413
    assert oversized.json()["code"] == "PAYLOAD_TOO_LARGE"


@pytest.mark.asyncio
async def test_exif_stripping_and_signed_private_media_access(storage_client):
    client, token, _ = storage_client
    headers = {"Authorization": f"Bearer {token}"}

    # Create JPEG with EXIF metadata tag (0x010F Make = "SecretCameraGPS")
    img = Image.new("RGB", (300, 400), color=(90, 120, 150))
    exif = img.getexif()
    exif[0x010F] = "SecretCameraModel"
    buf = BytesIO()
    img.save(buf, format="JPEG", exif=exif.tobytes())

    upload_res = await client.post(
        "/api/v1/media/uploads",
        files={"file": ("portrait.jpg", buf.getvalue(), "image/jpeg")},
        headers=headers,
    )
    assert upload_res.status_code == 201
    data = upload_res.json()
    assert data["object_key"].startswith("user-uploads/")
    signed_url = data["signed_url"]

    # Signed URL serves image with private cache header and stripped EXIF
    media_res = await client.get(signed_url)
    assert media_res.status_code == 200
    assert media_res.headers["cache-control"] == "private, no-store"
    decoded = Image.open(BytesIO(media_res.content))
    assert len(decoded.getexif()) == 0

    # Tampered signature rejected
    parsed = urlparse(signed_url)
    qs = parse_qs(parsed.query)
    tampered_url = f"{parsed.path}?key={qs['key'][0]}&expires={qs['expires'][0]}&uid={qs['uid'][0]}&sig=deadbeef"
    tamper_res = await client.get(tampered_url)
    assert tamper_res.status_code == 403

    # Expired signed URL rejected
    expired_url = LocalStorageBackend().generate_signed_url(data["object_key"], expires_in_seconds=1)
    # Manually build an expired signature
    past_exp = int(time.time()) - 10
    past_sig = LocalStorageBackend._compute_signature(data["object_key"], past_exp, "")
    expired_res = await client.get(
        f"/api/v1/media/signed?key={data['object_key']}&expires={past_exp}&uid=&sig={past_sig}"
    )
    assert expired_res.status_code == 401
    assert expired_url.startswith("/api/v1/media/signed")


def test_storage_path_traversal_and_cleanup(tmp_path):
    with pytest.raises(ForbiddenError):
        sanitize_storage_key("../../etc/passwd")

    backend = LocalStorageBackend(root_dir=str(tmp_path))
    expired_key = backend.put_object("user-uploads/u1/old.png", b"old-data")
    fresh_key = backend.put_object("user-uploads/u1/new.png", b"new-data")
    catalog_key = backend.put_object("catalog/shirt.png", b"catalog-data")

    # Age expired_key and catalog_key to 10 days ago
    ten_days_ago = time.time() - (10 * 86400)
    os.utime(tmp_path / expired_key, (ten_days_ago, ten_days_ago))
    os.utime(tmp_path / catalog_key, (ten_days_ago, ten_days_ago))

    removed = backend.cleanup_expired_objects(["user-uploads", "tryon-results"], retention_days=7)
    assert removed == 1
    assert not backend.exists(expired_key)
    assert backend.exists(fresh_key)
    assert backend.exists(catalog_key)
