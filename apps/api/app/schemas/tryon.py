import uuid
from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PaginationMeta

JobStatusType = Literal["queued", "processing", "completed", "failed", "cancelled"]


class TryOnJobCreateResponse(BaseModel):
    job_id: uuid.UUID
    status: JobStatusType = "queued"


class TryOnJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    product_id: uuid.UUID
    status: JobStatusType
    category: str
    model_name: str
    result_url: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    processing_time_ms: Optional[float] = None
    consent_at: datetime
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class TryOnJobListResponse(BaseModel):
    items: List[TryOnJobResponse]
    meta: PaginationMeta


class SavedLookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    job_id: uuid.UUID
    created_at: datetime


class WishlistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    product_id: uuid.UUID
    created_at: datetime


class ConsentRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    job_id: uuid.UUID
    consent_version: str
    consent_at: datetime
    purpose: str
