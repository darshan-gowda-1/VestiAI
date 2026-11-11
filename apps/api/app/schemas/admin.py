import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.schemas.common import PaginationMeta


class AdminAuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    admin_id: Optional[uuid.UUID] = None
    action: str
    entity_type: str
    entity_id: str
    summary: Optional[str] = None
    created_at: datetime


class AdminAuditLogListResponse(BaseModel):
    items: List[AdminAuditLogResponse]
    meta: PaginationMeta


class AdminJobSummary(BaseModel):
    """Privacy-minimized job record for admin monitoring (no user photos or PII)."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    status: str
    category: str
    model_name: str
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    processing_time_ms: Optional[float] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class AdminJobListResponse(BaseModel):
    items: List[AdminJobSummary]
    meta: PaginationMeta


class AdminUsageStatsResponse(BaseModel):
    total_users: int
    active_products: int
    archived_products: int
    total_jobs: int
    queued_jobs: int
    processing_jobs: int
    completed_jobs: int
    failed_jobs: int
    cancelled_jobs: int
    avg_processing_time_ms: Optional[float] = None
    total_saved_looks: int
