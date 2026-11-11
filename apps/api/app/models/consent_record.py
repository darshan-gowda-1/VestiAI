import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utc_now

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.tryon_job import TryOnJob


class ConsentRecord(Base):
    """Explicit user image-processing consent record."""

    __tablename__ = "consent_records"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tryon_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    consent_version: Mapped[str] = mapped_column(String(50), nullable=False, default="v1.0")
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    purpose: Mapped[str] = mapped_column(String(150), nullable=False, default="2d_virtual_tryon_processing")

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="consent_records")
    job: Mapped["TryOnJob"] = relationship(back_populates="consent_records")

