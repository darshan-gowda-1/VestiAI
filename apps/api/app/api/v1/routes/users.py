from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.consent_record import ConsentRecord
from app.models.user import User
from app.schemas.tryon import ConsentRecordResponse
from app.schemas.user import UserResponse, UserUpdate
from app.services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Retrieve the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update safe profile fields for the authenticated user."""
    updated = await AuthService.update_user_profile(db, current_user, payload)
    return UserResponse.model_validate(updated)


@router.get("/me/consents", response_model=List[ConsentRecordResponse])
async def list_my_consents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ConsentRecordResponse]:
    """List recorded image-processing consent records owned by the authenticated user."""
    stmt = (
        select(ConsentRecord)
        .where(ConsentRecord.user_id == current_user.id)
        .order_by(ConsentRecord.consent_at.desc())
    )
    records = (await db.execute(stmt)).scalars().all()
    return [ConsentRecordResponse.model_validate(r) for r in records]
