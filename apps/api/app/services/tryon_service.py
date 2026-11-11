import hashlib
import math
from typing import Dict, Optional, Set
import uuid

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.adapter import VirtualTryOnModel
from app.api.deps import ensure_owner_or_admin
from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError, UnprocessableEntityError
from app.db.base import utc_now
from app.models.tryon_job import TryOnJob
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.schemas.common import PaginationMeta
from app.schemas.tryon import (
    TryOnJobCreateResponse,
    TryOnJobListResponse,
    TryOnJobResponse,
)
from app.services.catalog_service import CatalogService
from app.services.image_validation import validate_and_sanitize_image
from app.services.storage_service import get_storage_backend
from app.workers.queue import job_queue

ALLOWED_JOB_TRANSITIONS: Dict[str, Set[str]] = {
    "queued": {"processing", "cancelled", "failed"},
    "processing": {"completed", "failed", "cancelled"},
    "failed": {"queued"},
    "completed": set(),
    "cancelled": set(),
}


def validate_job_transition(current_status: str, next_status: str) -> None:
    """Enforce valid TryOnJob status transitions."""
    allowed = ALLOWED_JOB_TRANSITIONS.get(current_status, set())
    if next_status not in allowed:
        raise ConflictError(
            f"Cannot transition try-on job from '{current_status}' to '{next_status}'."
        )


def _is_supported_category(category: str) -> bool:
    normalized = category.lower().strip().replace("-", "_").replace(" ", "_")
    supported = {c.replace("-", "_") for c in VirtualTryOnModel.SUPPORTED_CATEGORIES}
    return normalized in supported


class TryOnService:
    """Business logic for submitting, polling, cancelling, and deleting try-on jobs."""

    @staticmethod
    def to_response(job: TryOnJob) -> TryOnJobResponse:
        storage = get_storage_backend()
        owner_str = str(job.user_id) if job.user_id else ""

        person_url: Optional[str] = None
        if job.person_image_key:
            person_url = storage.generate_signed_url(
                job.person_image_key,
                expires_in_seconds=600,
                owner_id=owner_str,
            )

        result_url: Optional[str] = None
        if job.status == "completed" and job.result_image_key:
            result_url = storage.generate_signed_url(
                job.result_image_key,
                expires_in_seconds=600,
                owner_id=owner_str,
            )

        return TryOnJobResponse(
            id=job.id,
            user_id=job.user_id,
            product_id=job.product_id,
            status=job.status,  # type: ignore[arg-type]
            category=job.category,
            model_name=job.model_name,
            person_image_url=person_url,
            result_url=result_url,
            error_code=job.error_code,
            error_message=job.error_message,
            processing_time_ms=job.processing_time_ms,
            consent_at=job.consent_at,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
        )

    @staticmethod
    async def submit_job(
        db: AsyncSession,
        *,
        user: User,
        product_id: uuid.UUID,
        person_image: UploadFile,
        consent: bool,
        category: str = "upper_body",
        idempotency_key: Optional[str] = None,
    ) -> TryOnJobCreateResponse:
        if not consent:
            raise UnprocessableEntityError(
                code="CONSENT_REQUIRED",
                message="Explicit image-processing consent is required before submitting a try-on job.",
            )

        if not _is_supported_category(category):
            raise UnprocessableEntityError(
                code="UNSUPPORTED_CATEGORY",
                message=f"Category '{category}' is not supported. Only upper-body tops are currently supported.",
            )

        product = await CatalogService.get_product(db, product_id, allow_inactive=False)
        validated = await validate_and_sanitize_image(person_image)

        # Prevent duplicate submissions via explicit Idempotency-Key or active content hash
        img_digest = hashlib.sha256(validated.content).hexdigest()
        hash_dedup_key = f"hash:{user.id}:{product.id}:{category}:{img_digest}"
        lookup_keys = []
        if idempotency_key and idempotency_key.strip():
            lookup_keys.append((f"key:{user.id}:{idempotency_key.strip()}", ("queued", "processing", "completed")))
        lookup_keys.append((hash_dedup_key, ("queued", "processing")))

        for dedup_key, allowed_statuses in lookup_keys:
            existing_job_id = job_queue.get_idempotent_job_id(dedup_key)
            if existing_job_id:
                try:
                    existing_job = await JobRepository.get_by_id(db, uuid.UUID(existing_job_id))
                    if existing_job and existing_job.status in allowed_statuses:
                        return TryOnJobCreateResponse(
                            job_id=existing_job.id,
                            status=existing_job.status,  # type: ignore[arg-type]
                        )
                except ValueError:
                    pass

        job_id = uuid.uuid4()
        storage = get_storage_backend()
        person_key = f"user-uploads/{user.id}/{job_id}{validated.extension}"
        stored_person_key = storage.put_object(person_key, validated.content, validated.content_type)

        job = await JobRepository.create_job_with_consent(
            db,
            job_id=job_id,
            user_id=user.id,
            product_id=product.id,
            person_image_key=stored_person_key,
            garment_image_key=product.tryon_image_key,
            category=category,
            model_name=settings.MODEL_NAME,
            consent_at=utc_now(),
        )

        if idempotency_key and idempotency_key.strip():
            job_queue.set_idempotent_job_id(
                f"key:{user.id}:{idempotency_key.strip()}", str(job.id), ttl_seconds=60
            )
        job_queue.set_idempotent_job_id(hash_dedup_key, str(job.id), ttl_seconds=60)
        job_queue.enqueue(str(job.id))

        return TryOnJobCreateResponse(job_id=job.id, status="queued")

    @staticmethod
    async def get_job(
        db: AsyncSession,
        job_id: uuid.UUID,
        current_user: User,
    ) -> TryOnJobResponse:
        job = await JobRepository.get_by_id(db, job_id)
        if job is None:
            raise NotFoundError("Try-on job not found.")
        ensure_owner_or_admin(job.user_id, current_user)
        return TryOnService.to_response(job)

    @staticmethod
    async def list_jobs(
        db: AsyncSession,
        current_user: User,
        *,
        page: int = 1,
        limit: int = 20,
    ) -> TryOnJobListResponse:
        items, total = await JobRepository.list_by_user(
            db, current_user.id, page=page, limit=limit
        )
        total_pages = math.ceil(total / limit) if total > 0 else 0
        return TryOnJobListResponse(
            items=[TryOnService.to_response(job) for job in items],
            meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
        )

    @staticmethod
    async def cancel_job(
        db: AsyncSession,
        job_id: uuid.UUID,
        current_user: User,
    ) -> TryOnJobResponse:
        job = await JobRepository.get_by_id(db, job_id)
        if job is None:
            raise NotFoundError("Try-on job not found.")
        ensure_owner_or_admin(job.user_id, current_user)
        validate_job_transition(job.status, "cancelled")

        job.status = "cancelled"
        job.completed_at = utc_now()
        await db.commit()
        await db.refresh(job)
        return TryOnService.to_response(job)

    @staticmethod
    async def delete_job(
        db: AsyncSession,
        job_id: uuid.UUID,
        current_user: User,
    ) -> None:
        job = await JobRepository.get_by_id(db, job_id)
        if job is None:
            raise NotFoundError("Try-on job not found.")
        ensure_owner_or_admin(job.user_id, current_user)

        storage = get_storage_backend()
        if job.person_image_key:
            storage.delete_object(job.person_image_key)
        if job.result_image_key:
            storage.delete_object(job.result_image_key)

        await JobRepository.delete_job(db, job)
