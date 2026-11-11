import mimetypes
import uuid

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.exceptions import ForbiddenError
from app.core.rate_limit import rate_limit_tryon
from app.models.user import User
from app.services.image_validation import validate_and_sanitize_image
from app.services.storage_service import LocalStorageBackend, get_storage_backend, sanitize_storage_key

router = APIRouter(prefix="/media", tags=["Media & Storage"])


class UploadImageResponse(BaseModel):
    object_key: str
    signed_url: str
    content_type: str
    width: int
    height: int


def _guess_media_type(key: str) -> str:
    guessed, _ = mimetypes.guess_type(key)
    return guessed or "application/octet-stream"


@router.post(
    "/uploads",
    response_model=UploadImageResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_tryon)],
)
async def upload_private_person_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> UploadImageResponse:
    """
    Validate, sanitize (EXIF-strip), and store a user photograph in private storage.
    Returns an object key and short-lived signed URL.
    """
    validated = await validate_and_sanitize_image(file)
    storage = get_storage_backend()
    object_key = f"user-uploads/{current_user.id}/{uuid.uuid4().hex}{validated.extension}"
    stored_key = storage.put_object(object_key, validated.content, validated.content_type)
    signed_url = storage.generate_signed_url(
        stored_key,
        expires_in_seconds=300,
        owner_id=str(current_user.id),
    )
    return UploadImageResponse(
        object_key=stored_key,
        signed_url=signed_url,
        content_type=validated.content_type,
        width=validated.width,
        height=validated.height,
    )


@router.get("/signed")
async def get_signed_private_media(
    key: str = Query(...),
    expires: int = Query(...),
    uid: str = Query(""),
    sig: str = Query(...),
) -> Response:
    """
    Serve private user uploads or generated results only when HMAC signature and expiry are valid.
    """
    safe_key = LocalStorageBackend.verify_signed_params(key=key, expires=expires, uid=uid, sig=sig)
    storage = get_storage_backend()
    content = storage.get_object(safe_key)
    return Response(
        content=content,
        media_type=_guess_media_type(safe_key),
        headers={"Cache-Control": "private, no-store"},
    )


@router.get("/catalog/{filename:path}")
async def get_public_catalog_image(filename: str) -> Response:
    """
    Serve public catalog garment images. Strictly scoped to the 'catalog/' prefix.
    """
    safe_key = sanitize_storage_key(f"catalog/{filename}")
    if not safe_key.startswith("catalog/"):
        raise ForbiddenError("Access is restricted to public catalog assets.")
    storage = get_storage_backend()
    content = storage.get_object(safe_key)
    return Response(
        content=content,
        media_type=_guess_media_type(safe_key),
        headers={"Cache-Control": "public, max-age=3600"},
    )

