from typing import List
import uuid

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ensure_owner_or_admin, get_current_user
from app.core.exceptions import ConflictError, NotFoundError
from app.db.session import get_db
from app.models.saved_look import SavedLook
from app.models.user import User
from app.models.wishlist_item import WishlistItem
from app.repositories.job_repository import JobRepository
from app.schemas.tryon import SavedLookResponse, WishlistItemResponse
from app.services.catalog_service import CatalogService

router = APIRouter(tags=["Collections"])


class SaveLookRequest(BaseModel):
    job_id: uuid.UUID


class WishlistAddRequest(BaseModel):
    product_id: uuid.UUID


@router.get("/saved-looks", response_model=List[SavedLookResponse])
async def list_saved_looks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[SavedLookResponse]:
    """List saved try-on looks for the authenticated user."""
    stmt = (
        select(SavedLook)
        .where(SavedLook.user_id == current_user.id)
        .order_by(SavedLook.created_at.desc())
    )
    items = (await db.execute(stmt)).scalars().all()
    return [SavedLookResponse.model_validate(item) for item in items]


@router.post("/saved-looks", response_model=SavedLookResponse, status_code=status.HTTP_201_CREATED)
async def save_look(
    payload: SaveLookRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SavedLookResponse:
    """Save a completed try-on result owned by the authenticated user."""
    job = await JobRepository.get_by_id(db, payload.job_id)
    if job is None:
        raise NotFoundError("Try-on job not found.")
    ensure_owner_or_admin(job.user_id, current_user)
    if job.status != "completed":
        raise ConflictError("Only completed try-on results can be saved.")

    existing = (
        await db.execute(
            select(SavedLook).where(
                SavedLook.user_id == current_user.id,
                SavedLook.job_id == payload.job_id,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return SavedLookResponse.model_validate(existing)

    saved = SavedLook(user_id=current_user.id, job_id=payload.job_id)
    db.add(saved)
    await db.commit()
    await db.refresh(saved)
    return SavedLookResponse.model_validate(saved)


@router.delete("/saved-looks/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_saved_look(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a saved look from the authenticated user's collection."""
    saved = (
        await db.execute(
            select(SavedLook).where(
                SavedLook.user_id == current_user.id,
                SavedLook.job_id == job_id,
            )
        )
    ).scalar_one_or_none()
    if saved is None:
        raise NotFoundError("Saved look not found.")
    await db.delete(saved)
    await db.commit()


@router.get("/wishlist", response_model=List[WishlistItemResponse])
async def list_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[WishlistItemResponse]:
    """List wishlist items for the authenticated user."""
    stmt = (
        select(WishlistItem)
        .where(WishlistItem.user_id == current_user.id)
        .order_by(WishlistItem.created_at.desc())
    )
    items = (await db.execute(stmt)).scalars().all()
    return [WishlistItemResponse.model_validate(item) for item in items]


@router.post("/wishlist", response_model=WishlistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    payload: WishlistAddRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WishlistItemResponse:
    """Add an active catalog product to the authenticated user's wishlist."""
    await CatalogService.get_product(db, payload.product_id, allow_inactive=False)
    existing = (
        await db.execute(
            select(WishlistItem).where(
                WishlistItem.user_id == current_user.id,
                WishlistItem.product_id == payload.product_id,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return WishlistItemResponse.model_validate(existing)

    item = WishlistItem(user_id=current_user.id, product_id=payload.product_id)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return WishlistItemResponse.model_validate(item)


@router.delete("/wishlist/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_wishlist(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a product from the authenticated user's wishlist."""
    item = (
        await db.execute(
            select(WishlistItem).where(
                WishlistItem.user_id == current_user.id,
                WishlistItem.product_id == product_id,
            )
        )
    ).scalar_one_or_none()
    if item is None:
        raise NotFoundError("Wishlist item not found.")
    await db.delete(item)
    await db.commit()

