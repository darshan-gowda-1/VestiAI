import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utc_now

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product
    from app.models.saved_look import SavedLook
    from app.models.consent_record import ConsentRecord


class TryOnJob(Base):
    """Asynchronous 2D virtual try-on job record."""

    __tablename__ = "tryon_jobs"
    __table_args__ = (
        Index("ix_tryon_jobs_user_created", "user_id", "created_at"),
        Index("ix_tryon_jobs_status_created", "status", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="queued")
    person_image_key: Mapped[str] = mapped_column(String(500), nullable=False)
    garment_image_key: Mapped[str] = mapped_column(String(500), nullable=False)
    result_image_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="upper_body")
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False, default="idm-vton")
    error_code: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    processing_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="tryon_jobs")
    product: Mapped["Product"] = relationship(back_populates="tryon_jobs")
    saved_looks: Mapped[List["SavedLook"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )
    consent_records: Mapped[List["ConsentRecord"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )
