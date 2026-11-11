from typing import Optional
import uuid

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    Header,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.tryon import (
    TryOnJobCreateResponse,
    TryOnJobListResponse,
    TryOnJobResponse,
)
from app.services.tryon_service import TryOnService
from app.workers.tryon_worker import process_single_job

router = APIRouter(prefix="/tryon", tags=["Virtual Try-On Jobs"])


@router.post(
    "/jobs",
    response_model=TryOnJobCreateResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_tryon_job(
    background_tasks: BackgroundTasks,
    person_image: UploadFile = File(...),
    product_id: uuid.UUID = Form(...),
    consent: bool = Form(...),
    category: str = Form("upper_body"),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TryOnJobCreateResponse:
    """
    Validate consent and uploaded portrait, store photo privately, record consent,
    enqueue an asynchronous try-on job, and return job_id immediately.
    """
    created = await TryOnService.submit_job(
        db,
        user=current_user,
        product_id=product_id,
        person_image=person_image,
        consent=consent,
        category=category,
        idempotency_key=idempotency_key,
    )
    if settings.WORKER_AUTO_DISPATCH and created.status == "queued":
        background_tasks.add_task(process_single_job, created.job_id)
    return created


@router.get("/jobs", response_model=TryOnJobListResponse)
async def list_my_tryon_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TryOnJobListResponse:
    """List paginated try-on job history owned by the authenticated user."""
    return await TryOnService.list_jobs(db, current_user, page=page, limit=limit)


@router.get("/jobs/{job_id}", response_model=TryOnJobResponse)
async def get_tryon_job_status(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TryOnJobResponse:
    """Retrieve try-on job status and authorized short-lived result URL when completed."""
    return await TryOnService.get_job(db, job_id, current_user)


@router.post("/jobs/{job_id}/cancel", response_model=TryOnJobResponse)
async def cancel_tryon_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TryOnJobResponse:
    """Cancel a queued or processing try-on job safely."""
    return await TryOnService.cancel_job(db, job_id, current_user)


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tryon_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a try-on job and permanently remove its private input and result images."""
    await TryOnService.delete_job(db, job_id, current_user)


@router.delete("/jobs", status_code=status.HTTP_200_OK)
async def purge_my_tryon_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Permanently delete all try-on jobs and stored private photos owned by the current user."""
    removed = await TryOnService.purge_user_jobs(db, current_user)
    return {"deleted_jobs": removed}

