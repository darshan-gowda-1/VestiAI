"""Add ecommerce tables: categories, carts, orders, user_images and product extensions

Revision ID: 4f1a8c9b2e30
Revises: 9c4e2b1d7a10
Create Date: 2026-11-16 02:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "4f1a8c9b2e30"
down_revision: Union[str, None] = "9c4e2b1d7a10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Categories Table
    op.create_table(
        "categories",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)

    # 2. Product Columns
    op.add_column("products", sa.Column("category_id", sa.Uuid(), sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True))
    op.add_column("products", sa.Column("discount_price", sa.Numeric(10, 2), nullable=True))
    op.add_column("products", sa.Column("available_sizes", sa.String(length=100), nullable=False, server_default="XS,S,M,L,XL"))
    op.add_column("products", sa.Column("inventory", sa.Integer(), nullable=False, server_default="50"))
    op.create_index("ix_products_category_id", "products", ["category_id"])

    # 3. User Images Table
    op.create_table(
        "user_images",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=True),
        sa.Column("mime_type", sa.String(length=100), nullable=False, server_default="image/jpeg"),
        sa.Column("file_size", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_user_images_user_id", "user_images", ["user_id"])

    # 4. Carts Table
    op.create_table(
        "carts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_carts_user_id", "carts", ["user_id"], unique=True)

    # 5. Cart Items Table
    op.create_table(
        "cart_items",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("cart_id", sa.Uuid(), sa.ForeignKey("carts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Uuid(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("selected_size", sa.String(length=50), nullable=False, server_default="M"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_cart_items_cart_id", "cart_items", ["cart_id"])
    op.create_index("ix_cart_items_product_id", "cart_items", ["product_id"])

    # 6. Orders Table
    op.create_table(
        "orders",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="USD"),
        sa.Column("order_status", sa.String(length=50), nullable=False, server_default="confirmed"),
        sa.Column("payment_status", sa.String(length=50), nullable=False, server_default="paid"),
        sa.Column("shipping_address", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"])

    # 7. Order Items Table
    op.create_table(
        "order_items",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("order_id", sa.Uuid(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Uuid(), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("product_title", sa.String(length=200), nullable=False),
        sa.Column("product_image_key", sa.String(length=500), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("selected_size", sa.String(length=50), nullable=False, server_default="M"),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])


def downgrade() -> None:
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("cart_items")
    op.drop_table("carts")
    op.drop_table("user_images")
    op.drop_index("ix_products_category_id", table_name="products")
    op.drop_column("products", "inventory")
    op.drop_column("products", "available_sizes")
    op.drop_column("products", "discount_price")
    op.drop_column("products", "category_id")
    op.drop_table("categories")
