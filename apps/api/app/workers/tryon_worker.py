import asyncio
from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai.adapter import VirtualTryOnModel, get_tryon_model
from app.ai.pipeline import TryOnPipelineInput, TryOnPipelineService
from app.core.config import settings
from app.core.logging import logger
from app.db.base import utc_now
from app.db.session import AsyncSessionLocal
from app.repositories.job_repository import JobRepository
from app.services.storage_service import StorageBackend, get_storage_backend
from app.workers.queue import job_queue

RECOVERABLE_ERROR_CODES = {
    "INFERENCE_TIMEOUT",
    "REMOTE_ERROR",
    "REMOTE_WORKER_ERROR",
    "PIPELINE_INTERNAL_ERROR",
}


async def process_single_job(
    job_id: uuid.UUID,
    *,
    session_factory: Optional[async_sessionmaker[AsyncSession]] = None,
    model: Optional[VirtualTryOnModel] = None,
    storage: Optional[StorageBackend] = None,
    max_retries: Optional[int] = None,
    retry_delay_sec: float = 0.25,
) -> Optional[str]:
    """
    Claim a queued job, execute the AI try-on pipeline with bounded retries on
    recoverable failures, and persist final job status and private output reference.
    """
    factory = session_factory or AsyncSessionLocal
    store = storage or get_storage_backend()
    ai_model = model or get_tryon_model()
    retries = settings.MAX_JOB_RETRIES if max_retries is None else max_retries

    async with factory() as db:
        job = await JobRepository.get_by_id(db, job_id)
        if job is None:
            logger.warning("Worker skipped missing job_id=%s", job_id)
            return None

        if job.status != "queued":
            logger.info("Worker skipped job_id=%s with status=%s", job_id, job.status)
            return job.status

        job.status = "processing"
        job.started_at = utc_now()
        await db.commit()

        owner_folder = str(job.user_id) if job.user_id else "anonymous"
        output_key = f"tryon-results/{owner_folder}/{job.id}.png"
        pipeline = TryOnPipelineService(model=ai_model, storage=store)

        last_output = None
        for attempt in range(retries + 1):
            last_output = await pipeline.run(
                TryOnPipelineInput(
                    person_image_key=job.person_image_key,
                    garment_image_key=job.garment_image_key,
                    output_image_key=output_key,
                    category=job.category,
                )
            )
            if last_output.success:
                break
            if last_output.error_code not in RECOVERABLE_ERROR_CODES or attempt >= retries:
                break
            logger.warning(
                "Retrying recoverable job failure | job_id=%s attempt=%s code=%s",
                job.id,
                attempt + 1,
                last_output.error_code,
            )
            await asyncio.sleep(retry_delay_sec * (attempt + 1))

        # Re-read job to honor mid-flight cancellation
        await db.refresh(job)
        if job.status == "cancelled":
            if last_output and last_output.result_image_key:
                store.delete_object(last_output.result_image_key)
            logger.info("Worker discarded output for cancelled job_id=%s", job.id)
            return "cancelled"

        if last_output and last_output.success:
            job.status = "completed"
            job.result_image_key = last_output.result_image_key
            job.model_name = last_output.model_name
            job.processing_time_ms = last_output.total_ms
            job.error_code = None
            job.error_message = None
            job.completed_at = utc_now()
        else:
            job.status = "failed"
            job.error_code = last_output.error_code if last_output else "WORKER_FAILURE"
            job.error_message = (
                last_output.error_message
                if last_output
                else "Try-on job failed unexpectedly."
            )
            job.completed_at = utc_now()

        await db.commit()
        return job.status


async def run_worker_once(
    *,
    session_factory: Optional[async_sessionmaker[AsyncSession]] = None,
    model: Optional[VirtualTryOnModel] = None,
    storage: Optional[StorageBackend] = None,
) -> Optional[str]:
    """Pop one job from Redis/memory queue or poll the DB fallback queue and process it."""
    factory = session_factory or AsyncSessionLocal
    raw_id = job_queue.dequeue(timeout_seconds=0)

    if raw_id is None:
        async with factory() as db:
            queued = await JobRepository.list_queued_jobs(db, limit=1)
            if not queued:
                return None
            raw_id = str(queued[0].id)

    try:
        job_uuid = uuid.UUID(raw_id)
    except ValueError:
        logger.error("Invalid job_id dequeued: %s", raw_id)
        return None

    return await process_single_job(
        job_uuid,
        session_factory=factory,
        model=model,
        storage=storage,
    )


async def worker_loop(poll_interval_seconds: float = 1.0) -> None:
    """Long-running standalone AI worker daemon with crash recovery on startup."""
    logger.info("Starting VestiAI Try-On Worker (model=%s)", settings.MODEL_NAME)
    async with AsyncSessionLocal() as db:
        recovered = await JobRepository.recover_stale_processing_jobs(db)
        if recovered:
            logger.warning("Recovered %s stale processing job(s) on startup", recovered)

    model = get_tryon_model()
    storage = get_storage_backend()

    while True:
        processed_status = await run_worker_once(model=model, storage=storage)
        if processed_status is None:
            await asyncio.sleep(poll_interval_seconds)


if __name__ == "__main__":
    asyncio.run(worker_loop())

