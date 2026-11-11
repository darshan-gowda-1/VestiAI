import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    """Data access helpers for User records."""

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        normalized = email.strip().lower()
        result = await db.execute(select(User).where(User.email == normalized))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        email: str,
        password_hash: str,
        full_name: Optional[str] = None,
        role: str = "user",
    ) -> User:
        user = User(
            email=email.strip().lower(),
            password_hash=password_hash,
            full_name=full_name.strip() if full_name else None,
            role=role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def update_profile(
        db: AsyncSession,
        user: User,
        *,
        full_name: Optional[str] = None,
    ) -> User:
        user.full_name = full_name.strip() if full_name is not None else None
        await db.commit()
        await db.refresh(user)
        return user
