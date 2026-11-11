import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AdminAuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    admin_id: Optional[uuid.UUID] = None
    action: str
    entity_type: str
    entity_id: str
    summary: Optional[str] = None
    created_at: datetime

