import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, Index, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utc_now

if TYPE_CHECKING:
    from app.models.tryon_job import TryOnJob
    from app.models.wishlist_item import WishlistItem


class Product(Base):
    """Upper-body clothing catalog item."""

    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_category_active", "category", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    brand: Mapped[str] = mapped_column(String(100), nullable=False, default="Atelier Vesti")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(80), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    material: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    fit: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    image_key: Mapped[str] = mapped_column(String(500), nullable=False)
    tryon_image_key: Mapped[str] = mapped_column(String(500), nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    tryon_jobs: Mapped[List["TryOnJob"]] = relationship(back_populates="product")
    wishlist_items: Mapped[List["WishlistItem"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )

