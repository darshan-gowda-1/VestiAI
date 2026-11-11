from typing import Any, Dict

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_token_payload, get_current_user
from app.core.rate_limit import rate_limit_auth
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LogoutResponse, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_auth)],
)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register a new shopper account and return a bearer access token."""
    return await AuthService.register_user(db, payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit_auth)],
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate an existing account and return a bearer access token."""
    return await AuthService.authenticate_user(db, payload.email, payload.password)


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    payload: Dict[str, Any] = Depends(get_current_token_payload),
) -> LogoutResponse:
    """Invalidate the current access token so it cannot be reused."""
    AuthService.logout_token(jti=str(payload["jti"]), exp_timestamp=int(payload["exp"]))
    return LogoutResponse(message="Successfully logged out.")


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the currently authenticated user's account details."""
    return UserResponse.model_validate(current_user)

