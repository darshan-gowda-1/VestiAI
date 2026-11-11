import uuid
from typing import Any, Dict, Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token, token_blocklist
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_token_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    """Extract and validate Bearer JWT payload, ensuring token is not revoked."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError("Authentication credentials are missing or invalid.")

    payload = decode_access_token(credentials.credentials)
    jti = payload.get("jti", "")
    if token_blocklist.is_revoked(jti):
        raise UnauthorizedError("Session has been invalidated. Please log in again.")
    return payload


async def get_current_user(
    payload: Dict[str, Any] = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve authenticated active User from validated JWT payload."""
    try:
        user_id = uuid.UUID(str(payload["sub"]))
    except ValueError:
        raise UnauthorizedError("Invalid authentication subject.")

    user = await UserRepository.get_by_id(db, user_id)
    if user is None:
        raise UnauthorizedError("Account no longer exists.")

    if user.disabled_at is not None:
        raise ForbiddenError("This account has been disabled.")

    return user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Resolve authenticated User if Authorization header is supplied, otherwise None."""
    if credentials is None:
        return None
    payload = get_current_token_payload(credentials)
    return await get_current_user(payload, db)


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Restrict access to users with the 'admin' role."""
    if current_user.role != "admin":
        raise ForbiddenError("Administrator privileges are required for this action.")
    return current_user


def ensure_owner_or_admin(owner_id: Optional[uuid.UUID], current_user: User) -> None:
    """Enforce record ownership so private user resources cannot be accessed cross-user."""
    if current_user.role == "admin":
        return
    if owner_id is None or owner_id != current_user.id:
        raise ForbiddenError("You do not have permission to access this resource.")
