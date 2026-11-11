from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, UnauthorizedError
from app.core.security import (
    create_access_token,
    hash_password,
    token_blocklist,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate


class AuthService:
    """Authentication and user account business logic."""

    @staticmethod
    async def register_user(db: AsyncSession, payload: UserCreate) -> TokenResponse:
        existing = await UserRepository.get_by_email(db, payload.email)
        if existing is not None:
            raise ConflictError("An account with this email address already exists.")

        user = await UserRepository.create(
            db,
            email=payload.email,
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
            role="user",
        )
        token, _, expires_in = create_access_token(subject=user.id, role=user.role)
        return TokenResponse(
            access_token=token,
            expires_in=expires_in,
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
        user = await UserRepository.get_by_email(db, email)
        if user is None or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password.")

        if user.disabled_at is not None:
            raise ForbiddenError("This account has been disabled.")

        token, _, expires_in = create_access_token(subject=user.id, role=user.role)
        return TokenResponse(
            access_token=token,
            expires_in=expires_in,
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    def logout_token(jti: str, exp_timestamp: int) -> None:
        token_blocklist.revoke(jti=jti, exp_timestamp=exp_timestamp)

    @staticmethod
    async def update_user_profile(
        db: AsyncSession,
        user: User,
        payload: UserUpdate,
    ) -> User:
        fields_set = payload.model_fields_set
        if "full_name" in fields_set:
            return await UserRepository.update_profile(db, user, full_name=payload.full_name)
        return user

