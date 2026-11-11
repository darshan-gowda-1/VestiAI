from io import BytesIO
from PIL import Image
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.admin_audit_log import AdminAuditLog
from app.models.user import User
from app.services.catalog_service import CatalogService


@pytest_asyncio.fixture
async def catalog_env(tmp_path, monkeypatch):
    monkeypatch.setattr("app.core.config.settings.LOCAL_STORAGE_PATH", str(tmp_path))
    monkeypatch.setattr("app.core.config.settings.STORAGE_BACKEND", "local")

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
        shopper = User(email="shopper@catalog.test", password_hash=hash_password("Pass1234!"), role="user")
        admin = User(email="admin@catalog.test", password_hash=hash_password("Pass1234!"), role="admin")
        db.add_all([shopper, admin])
        await db.commit()
        await db.refresh(shopper)
        await db.refresh(admin)

    shopper_token, _, _ = create_access_token(shopper.id, "user")
    admin_token, _, _ = create_access_token(admin.id, "admin")

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client, session_factory, shopper_token, admin_token

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.mark.asyncio
async def test_catalog_listing_filtering_search_and_sort(catalog_env):
    client, _, _, _ = catalog_env

    # Paginated list (default limit=12, seeded=12)
    res = await client.get("/api/v1/products?page=1&limit=5")
    assert res.status_code == 200
    body = res.json()
    assert len(body["items"]) == 5
    assert body["meta"]["total"] == 12
    assert body["meta"]["total_pages"] == 3

    # Category filter
    shirt_res = await client.get("/api/v1/products?category=shirt")
    assert shirt_res.status_code == 200
    shirts = shirt_res.json()["items"]
    assert len(shirts) == 4
    assert all(item["category"] == "shirt" for item in shirts)

    # Search
    search_res = await client.get("/api/v1/products?search=Oxford")
    assert search_res.status_code == 200
    assert len(search_res.json()["items"]) == 1
    assert "Oxford" in search_res.json()["items"][0]["title"]

    # Sort price ascending
    asc_res = await client.get("/api/v1/products?sort=price_asc&limit=12")
    prices = [float(item["price"]) for item in asc_res.json()["items"]]
    assert prices == sorted(prices)

    # Product detail
    prod_id = shirts[0]["id"]
    detail_res = await client.get(f"/api/v1/products/{prod_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == prod_id


@pytest.mark.asyncio
async def test_admin_product_crud_and_role_guards(catalog_env):
    client, session_factory, shopper_token, admin_token = catalog_env

    payload = {
        "title": "Merino Knit Polo",
        "brand": "Atelier Vesti",
        "description": "Fine gauge merino wool knit polo shirt.",
        "category": "shirt",
        "color": "Burgundy",
        "price": "95.00",
        "material": "100% Merino Wool",
        "fit": "Slim Fit",
        "image_key": "catalog/placeholder.png",
        "tryon_image_key": "catalog/placeholder.png",
        "is_featured": True,
    }

    # Shopper cannot create product
    forbidden_res = await client.post(
        "/api/v1/admin/products",
        json=payload,
        headers={"Authorization": f"Bearer {shopper_token}"},
    )
    assert forbidden_res.status_code == 403

    # Admin creates product
    create_res = await client.post(
        "/api/v1/admin/products",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_res.status_code == 201
    created = create_res.json()
    prod_id = created["id"]

    # Admin updates product
    patch_res = await client.patch(
        f"/api/v1/admin/products/{prod_id}",
        json={"price": "99.00", "color": "Deep Burgundy"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["color"] == "Deep Burgundy"

    # Admin uploads product image
    buf = BytesIO()
    Image.new("RGB", (300, 400), color=(120, 40, 50)).save(buf, format="PNG")
    buf.seek(0)
    img_res = await client.post(
        f"/api/v1/admin/products/{prod_id}/image",
        files={"file": ("polo.png", buf.getvalue(), "image/png")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert img_res.status_code == 200
    assert img_res.json()["image_key"].startswith("catalog/")

    # Public catalog image endpoint serves the uploaded garment
    filename = img_res.json()["image_key"].split("catalog/", 1)[1]
    fetch_img = await client.get(f"/api/v1/media/catalog/{filename}")
    assert fetch_img.status_code == 200
    assert fetch_img.headers["content-type"] == "image/png"

    # Admin archives product
    del_res = await client.delete(
        f"/api/v1/admin/products/{prod_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_res.status_code == 200
    assert del_res.json()["is_active"] is False

    # Archived product is hidden from shopper detail endpoint
    hidden_res = await client.get(f"/api/v1/products/{prod_id}")
    assert hidden_res.status_code == 404

    # Audit logs recorded
    async with session_factory() as db:
        logs = (await db.execute(select(AdminAuditLog))).scalars().all()
        actions = {log.action for log in logs}
        assert {"CREATE_PRODUCT", "UPDATE_PRODUCT", "UPLOAD_PRODUCT_IMAGE", "ARCHIVE_PRODUCT"} <= actions
