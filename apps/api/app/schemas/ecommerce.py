from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


# Category Schemas
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=120)
    description: Optional[str] = None
    image_url: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    created_at: datetime
    product_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# Upload Schemas
class PresignedUploadRequest(BaseModel):
    filename: str = Field(..., max_length=255)
    mime_type: str = Field(..., pattern="^image/(jpeg|png|webp)$")
    file_size: int = Field(..., gt=0, le=10 * 1024 * 1024)  # max 10MB


class PresignedUploadResponse(BaseModel):
    upload_url: str
    storage_key: str
    expires_in_seconds: int = 900


class UploadCompleteRequest(BaseModel):
    storage_key: str
    filename: Optional[str] = None
    mime_type: str = "image/jpeg"
    file_size: int = 0
    width: Optional[int] = None
    height: Optional[int] = None


class UserImageResponse(BaseModel):
    id: uuid.UUID
    storage_key: str
    filename: Optional[str] = None
    mime_type: str
    file_size: int
    width: Optional[int] = None
    height: Optional[int] = None
    created_at: datetime
    download_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Cart Schemas
class CartItemAdd(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(1, ge=1, le=20)
    selected_size: str = Field("M", max_length=50)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, le=20)
    selected_size: Optional[str] = Field(None, max_length=50)


class CartItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_title: str
    product_image_url: str
    price: Decimal
    quantity: int
    selected_size: str
    item_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: uuid.UUID
    items: List[CartItemResponse]
    subtotal: Decimal
    item_count: int

    model_config = ConfigDict(from_attributes=True)


# Order Schemas
class OrderCheckoutRequest(BaseModel):
    shipping_address: Optional[str] = "123 Fashion Ave, New York, NY 10001"
    payment_method: str = "card_test"


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: Optional[uuid.UUID]
    product_title: str
    product_image_key: str
    product_image_url: Optional[str] = None
    quantity: int
    selected_size: str
    unit_price: Decimal
    total_price: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: uuid.UUID
    total_amount: Decimal
    currency: str
    order_status: str
    payment_status: str
    shipping_address: Optional[str]
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)
