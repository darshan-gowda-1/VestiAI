from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import utc_now
from app.models.consent_record import ConsentRecord
from app.models.tryon_job import TryOnJob


class JobRepository:
    """Database access helpers for TryOnJob and ConsentRecord rows."""

    @staticmethod
    async def get_by_id(db: AsyncSession, job_id: uuid.UUID) -> Optional[TryOnJob]:
        result = await db.execute(select(TryOnJob).where(TryOnJob.id == job_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_user(
        db: AsyncSession,
        user_id: uuid.UUID,
        *,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[TryOnJob], int]:
        count_stmt = select(func.count(TryOnJob.id)).where(TryOnJob.user_id == user_id)
        total = int((await db.execute(count_stmt)).scalar_one() or 0)

        offset = (page - 1) * limit
        stmt = (
            select(TryOnJob)
            .where(TryOnJob.user_id == user_id)
            .order_by(TryOnJob.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        items = list((await db.execute(stmt)).scalars().all())
        return items, total

    @staticmethod
    async def create_job_with_consent(
        db: AsyncSession,
        *,
        job_id: uuid.UUID,
        user_id: uuid.UUID,
        product_id: uuid.UUID,
        person_image_key: str,
        garment_image_key: str,
        category: str,
        model_name: str,
        consent_at: datetime,
    ) -> TryOnJob:
        job = TryOnJob(
            id=job_id,
            user_id=user_id,
            product_id=product_id,
            status="queued",
            person_image_key=person_image_key,
            garment_image_key=garment_image_key,
            category=category,
            consent_at=consent_at,
            model_name=model_name,
        )
        consent = ConsentRecord(
            user_id=user_id,
            job_id=job_id,
            consent_version="v1.0",
            consent_at=consent_at,
            purpose="2d_virtual_tryon_processing",
        )
        db.add(job)
        db.add(consent)
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def list_queued_jobs(db: AsyncSession, limit: int = 10) -> List[TryOnJob]:
        stmt = (
            select(TryOnJob)
            .where(TryOnJob.status == "queued")
            .order_by(TryOnJob.created_at.asc())
            .limit(limit)
        )
        return list((await db.execute(stmt)).scalars().all())

    @staticmethod
    async def recover_stale_processing_jobs(
        db: AsyncSession,
        *,
        stale_after_seconds: int = 300,
    ) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=stale_after_seconds)
        stmt = select(TryOnJob).where(
            TryOnJob.status == "processing",
            TryOnJob.started_at.is_not(None),
            TryOnJob.started_at < cutoff,
        )
        stale_jobs = list((await db.execute(stmt)).scalars().all())
        now = utc_now()
        for job in stale_jobs:
            job.status = "failed"
            job.error_code = "WORKER_CRASH_RECOVERED"
            job.error_message = "Processing worker terminated unexpectedly. Please retry your try-on."
            job.completed_at = now
        if stale_jobs:
            await db.commit()
        return len(stale_jobs)

    @staticmethod
    async def delete_job(db: AsyncSession, job: TryOnJob) -> None:
        await db.delete(job)
        await db.commit()

