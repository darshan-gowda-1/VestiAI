"""Add currency, retailer_url, and source to products

Revision ID: 9c4e2b1d7a10
Revises: 2ab687efcfd1
Create Date: 2026-11-12 19:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9c4e2b1d7a10"
down_revision: Union[str, None] = "2ab687efcfd1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="USD"),
    )
    op.add_column(
        "products",
        sa.Column("retailer_url", sa.String(length=1000), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("source", sa.String(length=100), nullable=False, server_default="vestiai"),
    )


def downgrade() -> None:
    op.drop_column("products", "source")
    op.drop_column("products", "retailer_url")
    op.drop_column("products", "currency")

