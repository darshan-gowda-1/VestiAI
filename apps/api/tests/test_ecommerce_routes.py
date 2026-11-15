import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.category import Category
from app.models.product import Product
from app.models.user import User


@pytest.mark.asyncio
async def test_ecommerce_uploads_cart_and_orders(tmp_path, monkeypatch):
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
        user = User(email="shopper@example.com", password_hash=hash_password("Pass1234!"), role="user")
        admin = User(email="admin@example.com", password_hash=hash_password("Admin1234!"), role="admin")
        db.add_all([user, admin])
        await db.flush()

        product = Product(
            title="Cashmere Mockneck Knit",
            brand="Atelier Vesti",
            description="Luxury knitwear item",
            category="sweatshirt",
            color="Charcoal Grey",
            price=180.00,
            discount_price=150.00,
            currency="USD",
            image_key="catalog/mockneck.png",
            tryon_image_key="catalog/mockneck.png",
            available_sizes="S,M,L",
            inventory=25,
            is_active=True,
        )
        db.add(product)
        await db.commit()
        await db.refresh(user)
        await db.refresh(admin)
        await db.refresh(product)

    user_token, _, _ = create_access_token(user.id, "user")
    admin_token, _, _ = create_access_token(admin.id, "admin")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # 1. Admin creates a category
            cat_payload = {
                "name": "Sweatshirts & Knits",
                "slug": "sweatshirts-knits",
                "description": "Premium knitwear collection",
            }
            cat_resp = await client.post("/api/v1/catalog-categories", json=cat_payload, headers=admin_headers)
            assert cat_resp.status_code == 201
            assert cat_resp.json()["name"] == "Sweatshirts & Knits"

            # 2. Presigned upload flow
            presign_req = {
                "filename": "me.jpg",
                "mime_type": "image/jpeg",
                "file_size": 204800,
            }
            presign_resp = await client.post("/api/v1/uploads/presign", json=presign_req, headers=user_headers)
            assert presign_resp.status_code == 200
            data = presign_resp.json()
            assert "upload_url" in data
            storage_key = data["storage_key"]

            # Direct upload simulation (via local storage backend direct-upload endpoint)
            upload_url = data["upload_url"]
            put_resp = await client.put(upload_url, content=b"fake-image-bytes", headers={"Content-Type": "image/jpeg"})
            assert put_resp.status_code == 200

            # Complete upload
            complete_req = {
                "storage_key": storage_key,
                "filename": "me.jpg",
                "mime_type": "image/jpeg",
                "file_size": 16,
            }
            complete_resp = await client.post("/api/v1/uploads/complete", json=complete_req, headers=user_headers)
            assert complete_resp.status_code == 201
            img_info = complete_resp.json()
            assert img_info["storage_key"] == storage_key
            assert "download_url" in img_info

            # List user images
            list_img_resp = await client.get("/api/v1/uploads", headers=user_headers)
            assert list_img_resp.status_code == 200
            assert len(list_img_resp.json()) == 1

            # 3. Cart CRUD
            # Add to cart
            add_resp = await client.post(
                "/api/v1/cart/items",
                json={"product_id": str(product.id), "quantity": 2, "selected_size": "M"},
                headers=user_headers,
            )
            assert add_resp.status_code == 201
            cart_data = add_resp.json()
            assert cart_data["item_count"] == 2
            assert float(cart_data["subtotal"]) == 300.00  # 2 * 150.00 discount price

            item_id = cart_data["items"][0]["id"]

            # Update cart item quantity
            update_resp = await client.put(
                f"/api/v1/cart/items/{item_id}",
                json={"quantity": 1, "selected_size": "L"},
                headers=user_headers,
            )
            assert update_resp.status_code == 200
            assert update_resp.json()["item_count"] == 1
            assert update_resp.json()["items"][0]["selected_size"] == "L"

            # 4. Checkout Order
            checkout_resp = await client.post(
                "/api/v1/orders/checkout",
                json={"shipping_address": "742 Evergreen Terrace", "payment_method": "card_test"},
                headers=user_headers,
            )
            assert checkout_resp.status_code == 201
            order_data = checkout_resp.json()
            assert float(order_data["total_amount"]) == 150.00
            assert order_data["order_status"] == "confirmed"
            assert len(order_data["items"]) == 1
            assert order_data["items"][0]["selected_size"] == "L"

            # Verify cart is now empty
            cart_after = await client.get("/api/v1/cart", headers=user_headers)
            assert cart_after.json()["item_count"] == 0

            # List user orders
            orders_resp = await client.get("/api/v1/orders", headers=user_headers)
            assert orders_resp.status_code == 200
            assert len(orders_resp.json()) == 1

    finally:
        app.dependency_overrides.clear()
