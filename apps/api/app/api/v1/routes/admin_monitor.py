import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.admin_audit_log import AdminAuditLog
from app.models.product import Product
from app.models.saved_look import SavedLook
from app.models.tryon_job import TryOnJob
from app.models.user import User
from app.schemas.admin import (
    AdminAuditLogListResponse,
    AdminAuditLogResponse,
    AdminJobListResponse,
    AdminJobSummary,
    AdminUsageStatsResponse,
)
from app.schemas.common import PaginationMeta

router = APIRouter(prefix="/admin", tags=["Admin Monitoring"])


@router.get("/jobs", response_model=AdminJobListResponse)
async def admin_list_jobs(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminJobListResponse:
    """List try-on jobs for operational monitoring with zero private user photos or PII."""
    filters = []
    if status_filter and status_filter.strip():
        filters.append(TryOnJob.status == status_filter.strip().lower())

    total = int((await db.execute(select(func.count(TryOnJob.id)).where(*filters))).scalar_one() or 0)
    offset = (page - 1) * limit
    stmt = (
        select(TryOnJob)
        .where(*filters)
        .order_by(TryOnJob.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = (await db.execute(stmt)).scalars().all()
    total_pages = math.ceil(total / limit) if total > 0 else 0
    return AdminJobListResponse(
        items=[AdminJobSummary.model_validate(item) for item in items],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )


@router.get("/stats", response_model=AdminUsageStatsResponse)
async def admin_usage_stats(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUsageStatsResponse:
    """Return real aggregate usage statistics from the database."""
    total_users = int((await db.execute(select(func.count(User.id)))).scalar_one() or 0)
    active_products = int(
        (await db.execute(select(func.count(Product.id)).where(Product.is_active.is_(True)))).scalar_one() or 0
    )
    archived_products = int(
        (await db.execute(select(func.count(Product.id)).where(Product.is_active.is_(False)))).scalar_one() or 0
    )

    status_rows = (
        await db.execute(select(TryOnJob.status, func.count(TryOnJob.id)).group_by(TryOnJob.status))
    ).all()
    counts = {row[0]: int(row[1]) for row in status_rows}
    total_jobs = sum(counts.values())

    avg_ms_raw = (
        await db.execute(
            select(func.avg(TryOnJob.processing_time_ms)).where(TryOnJob.status == "completed")
        )
    ).scalar_one()
    avg_ms = round(float(avg_ms_raw), 2) if avg_ms_raw is not None else None

    total_saved_looks = int((await db.execute(select(func.count(SavedLook.id)))).scalar_one() or 0)

    return AdminUsageStatsResponse(
        total_users=total_users,
        active_products=active_products,
        archived_products=archived_products,
        total_jobs=total_jobs,
        queued_jobs=counts.get("queued", 0),
        processing_jobs=counts.get("processing", 0),
        completed_jobs=counts.get("completed", 0),
        failed_jobs=counts.get("failed", 0),
        cancelled_jobs=counts.get("cancelled", 0),
        avg_processing_time_ms=avg_ms,
        total_saved_looks=total_saved_looks,
    )


@router.get("/audit-logs", response_model=AdminAuditLogListResponse)
async def admin_list_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminAuditLogListResponse:
    """List recent administrative audit trail entries."""
    total = int((await db.execute(select(func.count(AdminAuditLog.id)))).scalar_one() or 0)
    offset = (page - 1) * limit
    stmt = (
        select(AdminAuditLog)
        .order_by(AdminAuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = (await db.execute(stmt)).scalars().all()
    total_pages = math.ceil(total / limit) if total > 0 else 0
    return AdminAuditLogListResponse(
        items=[AdminAuditLogResponse.model_validate(item) for item in items],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )

