import uuid
from typing import List
from fastapi import APIRouter, Depends, status, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.db.session import get_db
from app.models.user import User
from app.models.user_image import UserImage
from app.schemas.ecommerce import (
    PresignedUploadRequest,
    PresignedUploadResponse,
    UploadCompleteRequest,
    UserImageResponse,
)
from app.services.storage_service import get_storage_backend, sanitize_storage_key

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/presign", response_model=PresignedUploadResponse)
async def get_presigned_upload_url(
    payload: PresignedUploadRequest,
    current_user: User = Depends(get_current_user),
) -> PresignedUploadResponse:
    """Generate an authenticated presigned upload URL directly to R2 / Storage backend."""
    storage = get_storage_backend()
    ext = payload.filename.rsplit(".", 1)[-1] if "." in payload.filename else "jpg"
    storage_key = f"uploads/{current_user.id}/{uuid.uuid4().hex}.{ext}"
    
    upload_url = storage.generate_presigned_upload_url(
        key=storage_key,
        content_type=payload.mime_type,
        expires_in_seconds=900,
    )
    return PresignedUploadResponse(
        upload_url=upload_url,
        storage_key=storage_key,
        expires_in_seconds=900,
    )


@router.put("/direct-upload")
async def handle_direct_upload(
    request: Request,
    key: str,
    expires: int,
    sig: str,
    uid: str = "anon",
) -> Response:
    """Endpoint for local storage backend to receive simulated presigned uploads."""
    storage = get_storage_backend()
    if not hasattr(storage, "verify_signed_params"):
        raise BadRequestError("Direct upload endpoint not supported on active backend.")
    
    storage.verify_signed_params(key=key, expires=expires, uid=uid, sig=sig)
    body = await request.body()
    content_type = request.headers.get("content-type", "application/octet-stream")
    storage.put_object(key=key, data=body, content_type=content_type)
    return Response(status_code=status.HTTP_200_OK)


@router.post("/complete", response_model=UserImageResponse, status_code=status.HTTP_201_CREATED)
async def complete_upload(
    payload: UploadCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserImageResponse:
    """Register and persist metadata for a completed upload."""
    storage = get_storage_backend()
    safe_key = sanitize_storage_key(payload.storage_key)
    
    # Verify file was actually saved
    if not storage.exists(safe_key):
        raise BadRequestError("Uploaded object does not exist in storage.")

    user_image = UserImage(
        user_id=current_user.id,
        storage_key=safe_key,
        filename=payload.filename or "upload.jpg",
        mime_type=payload.mime_type,
        file_size=payload.file_size,
        width=payload.width,
        height=payload.height,
    )
    db.add(user_image)
    await db.commit()
    await db.refresh(user_image)

    download_url = storage.generate_signed_url(user_image.storage_key, owner_id=str(current_user.id))
    return UserImageResponse(
        id=user_image.id,
        storage_key=user_image.storage_key,
        filename=user_image.filename,
        mime_type=user_image.mime_type,
        file_size=user_image.file_size,
        width=user_image.width,
        height=user_image.height,
        created_at=user_image.created_at,
        download_url=download_url,
    )


@router.get("", response_model=List[UserImageResponse])
async def list_user_images(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[UserImageResponse]:
    """List all photographs uploaded by current user."""
    storage = get_storage_backend()
    stmt = (
        select(UserImage)
        .where(UserImage.user_id == current_user.id)
        .order_by(UserImage.created_at.desc())
    )
    result = await db.execute(stmt)
    images = result.scalars().all()
    return [
        UserImageResponse(
            id=img.id,
            storage_key=img.storage_key,
            filename=img.filename,
            mime_type=img.mime_type,
            file_size=img.file_size,
            width=img.width,
            height=img.height,
            created_at=img.created_at,
            download_url=storage.generate_signed_url(img.storage_key, owner_id=str(current_user.id)),
        )
        for img in images
    ]


@router.get("/{image_id}", response_model=UserImageResponse)
async def get_user_image(
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserImageResponse:
    """Retrieve metadata for a specific uploaded photo."""
    stmt = select(UserImage).where(UserImage.id == image_id, UserImage.user_id == current_user.id)
    img = (await db.execute(stmt)).scalar_one_or_none()
    if not img:
        raise NotFoundError("Uploaded image not found.")
    storage = get_storage_backend()
    return UserImageResponse(
        id=img.id,
        storage_key=img.storage_key,
        filename=img.filename,
        mime_type=img.mime_type,
        file_size=img.file_size,
        width=img.width,
        height=img.height,
        created_at=img.created_at,
        download_url=storage.generate_signed_url(img.storage_key, owner_id=str(current_user.id)),
    )
