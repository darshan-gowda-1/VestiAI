from datetime import datetime, timezone
from fastapi import APIRouter

from app.core.config import settings
from app.db.session import check_database_connection
from app.schemas.common import HealthResponse

router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse)
async def api_v1_health_check() -> HealthResponse:
    """
    API v1 health status endpoint including live database connectivity check.
    """
    db_ok, db_status = await check_database_connection()
    overall_status = "healthy" if db_ok else "degraded"
    return HealthResponse(
        status=overall_status,
        version="1.0.0",
        api_prefix=settings.API_V1_STR,
        database=db_status,
        storage_backend=settings.STORAGE_BACKEND,
        model_configured=settings.MODEL_NAME,
        timestamp=datetime.now(timezone.utc),
    )

