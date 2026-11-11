from datetime import datetime, timezone
from sqlalchemy.orm import DeclarativeBase


def utc_now() -> datetime:
    """Return timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Base SQLAlchemy 2.0 declarative class for all VestiAI ORM models."""
    pass

