from decimal import Decimal
from typing import Optional
import uuid
from urllib.parse import urlparse

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.exceptions import UnprocessableEntityError
from app.core.rate_limit import rate_limit_tryon
from app.db.base import utc_now
from app.db.session import get_db
from app.models.consent_record import ConsentRecord
from app.models.product import Product
from app.models.tryon_job import TryOnJob
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.tryon import TryOnJobCreateResponse
from app.services.image_validation import validate_and_sanitize_image
from app.services.storage_service import get_storage_backend
from app.workers.queue import job_queue
from app.workers.tryon_worker import process_single_job

router = APIRouter(prefix="/extension", tags=["Chrome Extension"])


class ExtensionProductContextRequest(BaseModel):
    image_url: str = Field(..., max_length=1000)
    page_url: str = Field(..., max_length=1000)
    title: Optional[str] = Field(None, max_length=200)
    retailer_domain: Optional[str] = Field(None, max_length=150)

    @field_validator("image_url", "page_url")
    @classmethod
    def validate_http_url(cls, v: str) -> str:
        parsed = urlparse(v)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise ValueError("URL must be a valid http:// or https:// address.")
        return v


class ExtensionProductContextResponse(BaseModel):
    image_url: str
    page_url: str
    title: Optional[str] = None
    retailer_domain: str


@router.post("/session")
async def verify_extension_session(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Verify extension authentication token and return active user session."""
    return {
        "authenticated": True,
        "api_version": "2.0",
        "user": UserResponse.model_validate(current_user),
    }


@router.post("/product", response_model=ExtensionProductContextResponse)
async def register_extension_product_context(
    payload: ExtensionProductContextRequest,
    current_user: User = Depends(get_current_user),
) -> ExtensionProductContextResponse:
    """Validate and normalize product context extracted by the Chrome extension."""
    domain = payload.retailer_domain or urlparse(payload.page_url).netloc
    return ExtensionProductContextResponse(
        image_url=payload.image_url,
        page_url=payload.page_url,
        title=payload.title,
        retailer_domain=domain,
    )


@router.post(
    "/tryon",
    response_model=TryOnJobCreateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(rate_limit_tryon)],
)
async def create_extension_tryon_job(
    background_tasks: BackgroundTasks,
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    consent: bool = Form(...),
    category: str = Form("upper_body"),
    retailer_url: Optional[str] = Form(None),
    product_title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TryOnJobCreateResponse:
    """Submit a try-on job from the Chrome extension using uploaded person and garment images."""
    if not consent:
        raise UnprocessableEntityError(
            code="CONSENT_REQUIRED",
            message="Explicit image-processing consent is required.",
        )

    if retailer_url:
        parsed = urlparse(retailer_url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise UnprocessableEntityError(
                code="INVALID_RETAILER_URL",
                message="Retailer URL must start with http:// or https://.",
            )

    validated_person = await validate_and_sanitize_image(person_image)
    validated_garment = await validate_and_sanitize_image(garment_image)

    storage = get_storage_backend()
    job_uuid = uuid.uuid4()
    person_key = f"uploads/{current_user.id}/{job_uuid}-person{validated_person.extension}"
    garment_key = f"uploads/{current_user.id}/{job_uuid}-garment{validated_garment.extension}"

    storage.put_object(person_key, validated_person.content, validated_person.content_type)
    storage.put_object(garment_key, validated_garment.content, validated_garment.content_type)

    domain = urlparse(retailer_url).netloc if retailer_url else "external-retailer"
    ext_product = Product(
        title=(product_title or "External Retailer Garment")[:200],
        brand=domain[:100],
        description="Garment imported via VestiAI Chrome Extension for 2D virtual try-on.",
        category="t-shirt",
        color="Imported",
        price=Decimal("0.01"),
        currency="USD",
        image_key=garment_key,
        tryon_image_key=garment_key,
        retailer_url=retailer_url,
        source=domain[:100],
        is_featured=False,
        is_active=False,
    )
    db.add(ext_product)
    await db.flush()

    now = utc_now()
    job = TryOnJob(
        id=job_uuid,
        user_id=current_user.id,
        product_id=ext_product.id,
        status="queued",
        person_image_key=person_key,
        garment_image_key=garment_key,
        category=category,
        consent_at=now,
        model_name=settings.MODEL_NAME,
    )
    db.add(job)
    db.add(
        ConsentRecord(
            user_id=current_user.id,
            job_id=job.id,
            consent_version="v2.0",
            consent_at=now,
            purpose="chrome_extension_2d_tryon",
        )
    )
    await db.commit()

    job_queue.enqueue(str(job.id))
    if settings.WORKER_AUTO_DISPATCH:
        background_tasks.add_task(process_single_job, job.id)

    return TryOnJobCreateResponse(job_id=job.id, status="queued")

