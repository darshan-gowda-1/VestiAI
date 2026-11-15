import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utc_now

if TYPE_CHECKING:
    from app.models.admin_audit_log import AdminAuditLog
    from app.models.cart import Cart
    from app.models.consent_record import ConsentRecord
    from app.models.order import Order
    from app.models.saved_look import SavedLook
    from app.models.tryon_job import TryOnJob
    from app.models.user_image import UserImage
    from app.models.wishlist_item import WishlistItem


class User(Base):
    """Registered shopper or administrator account."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    disabled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    tryon_jobs: Mapped[List["TryOnJob"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    saved_looks: Mapped[List["SavedLook"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    wishlist_items: Mapped[List["WishlistItem"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    cart: Mapped[Optional["Cart"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    orders: Mapped[List["Order"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    uploaded_images: Mapped[List["UserImage"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    consent_records: Mapped[List["ConsentRecord"]] = relationship(back_populates="user")
    audit_logs: Mapped[List["AdminAuditLog"]] = relationship(back_populates="admin")
