from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings


def create_engine_from_url(database_url: str) -> AsyncEngine:
    """Create SQLAlchemy async engine configured for PostgreSQL or SQLite."""
    is_sqlite = database_url.startswith("sqlite")
    kwargs = {"echo": settings.DB_ECHO}
    if is_sqlite:
        kwargs["connect_args"] = {"check_same_thread": False}
    else:
        kwargs["pool_pre_ping"] = True
        kwargs["pool_size"] = 5
        kwargs["max_overflow"] = 10
    return create_async_engine(database_url, **kwargs)


engine = create_engine_from_url(settings.DATABASE_URL)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_database_connection(target_engine: AsyncEngine | None = None) -> tuple[bool, str]:
    """Probe database connectivity without raising unhandled errors."""
    db_engine = target_engine or engine
    try:
        async with db_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True, "connected"
    except Exception as exc:
        return False, f"unavailable ({type(exc).__name__})"
