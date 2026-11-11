from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    code: str = Field(..., description="Stable application error code")
    message: str = Field(..., description="Safe user-facing error description")
    request_id: str = Field(..., description="Correlation request ID")


class HealthResponse(BaseModel):
    status: str
    version: str
    api_prefix: str
    database: str
    storage_backend: str
    model_configured: str
    timestamp: datetime


class PaginationMeta(BaseModel):
    page: int = Field(..., ge=1)
    limit: int = Field(..., ge=1, le=100)
    total: int = Field(..., ge=0)
    total_pages: int = Field(..., ge=0)
