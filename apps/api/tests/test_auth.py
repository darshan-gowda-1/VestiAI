import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import ensure_owner_or_admin, require_admin
from app.core.exceptions import ForbiddenError
from app.core.security import hash_password, token_blocklist
from app.db.base import Base, utc_now
from app.db.session import get_db
from app.main import app
from app.models.user import User


@pytest_asyncio.fixture
async def auth_client_and_db():
    """Create an isolated async SQLite DB and AsyncClient overriding get_db."""
    token_blocklist.clear_memory()
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac, session_factory

    app.dependency_overrides.clear()
    token_blocklist.clear_memory()
    await engine.dispose()


@pytest.mark.asyncio
async def test_register_and_login_flow(auth_client_and_db):
    client, session_factory = auth_client_and_db

    # Register
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "  Shopper@VestiAI.edu ",
            "password": "StrongPassword123!",
            "full_name": "Alex Mercer",
        },
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["token_type"] == "bearer"
    assert reg_data["user"]["email"] == "shopper@vestiai.edu"
    assert reg_data["user"]["role"] == "user"
    assert "password_hash" not in reg_data["user"]

    # Verify password was hashed in DB
    async with session_factory() as db:
        db_user = (
            await db.execute(select(User).where(User.email == "shopper@vestiai.edu"))
        ).scalar_one()
        assert db_user.password_hash != "StrongPassword123!"
        assert db_user.password_hash.startswith("$2b$")

    # Duplicate email conflict
    dup_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "shopper@vestiai.edu", "password": "AnotherPassword123!"},
    )
    assert dup_res.status_code == 409
    assert dup_res.json()["code"] == "CONFLICT"

    # Login success
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "shopper@vestiai.edu", "password": "StrongPassword123!"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Login wrong password
    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "shopper@vestiai.edu", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401
    assert bad_login.json()["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_protected_endpoints_and_logout_invalidation(auth_client_and_db):
    client, _ = auth_client_and_db

    # Unauthenticated request fails with 401
    unauth_res = await client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401
    assert unauth_res.json()["code"] == "UNAUTHORIZED"

    # Invalid bearer token fails with 401
    invalid_res = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer not.a.valid.jwt"},
    )
    assert invalid_res.status_code == 401

    # Register & authenticate
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "session@vestiai.edu", "password": "SecurePass99!"},
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "session@vestiai.edu"

    # Logout revokes the token
    logout_res = await client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # Reusing revoked token must fail with 401
    reused_res = await client.get("/api/v1/users/me", headers=headers)
    assert reused_res.status_code == 401
    assert reused_res.json()["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_profile_retrieval_and_update(auth_client_and_db):
    client, _ = auth_client_and_db

    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "profile@vestiai.edu", "password": "ProfilePass123!", "full_name": "Old Name"},
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    patch_res = await client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"full_name": "Updated Fashionista", "role": "admin"},  # role ignored by schema
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["full_name"] == "Updated Fashionista"
    assert data["role"] == "user"


@pytest.mark.asyncio
async def test_disabled_user_blocked(auth_client_and_db):
    client, session_factory = auth_client_and_db

    async with session_factory() as db:
        disabled_user = User(
            email="disabled@vestiai.edu",
            password_hash=hash_password("DisabledPass123!"),
            role="user",
            disabled_at=utc_now(),
        )
        db.add(disabled_user)
        await db.commit()

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "disabled@vestiai.edu", "password": "DisabledPass123!"},
    )
    assert login_res.status_code == 403
    assert login_res.json()["code"] == "FORBIDDEN"


def test_role_guard_and_data_ownership_isolation():
    user_a = User(id=uuid.uuid4(), email="a@vestiai.edu", password_hash="h", role="user")
    user_b = User(id=uuid.uuid4(), email="b@vestiai.edu", password_hash="h", role="user")
    admin = User(id=uuid.uuid4(), email="admin@vestiai.edu", password_hash="h", role="admin")

    # Non-admin blocked from admin guard
    with pytest.raises(ForbiddenError):
        require_admin(user_a)
    assert require_admin(admin) == admin

    # Owner allowed
    ensure_owner_or_admin(user_a.id, user_a)

    # Cross-user access blocked
    with pytest.raises(ForbiddenError):
        ensure_owner_or_admin(user_b.id, user_a)

    # Admin allowed across users
    ensure_owner_or_admin(user_b.id, admin)
