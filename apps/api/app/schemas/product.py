import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PaginationMeta

GarmentCategoryType = Literal["t-shirt", "shirt", "sweatshirt", "blouse"]


class ProductBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    brand: str = Field(default="Atelier Vesti", max_length=100)
    description: str = Field(..., min_length=5)
    category: GarmentCategoryType
    color: str = Field(..., min_length=2, max_length=80)
    price: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    material: Optional[str] = Field(None, max_length=150)
    fit: Optional[str] = Field(None, max_length=100)
    is_featured: bool = False


class ProductCreate(ProductBase):
    image_key: str = Field(..., max_length=500)
    tryon_image_key: str = Field(..., max_length=500)


class ProductUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    brand: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, min_length=5)
    category: Optional[GarmentCategoryType] = None
    color: Optional[str] = Field(None, min_length=2, max_length=80)
    price: Optional[Decimal] = Field(None, gt=0, max_digits=10, decimal_places=2)
    material: Optional[str] = Field(None, max_length=150)
    fit: Optional[str] = Field(None, max_length=100)
    image_key: Optional[str] = Field(None, max_length=500)
    tryon_image_key: Optional[str] = Field(None, max_length=500)
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    image_key: str
    tryon_image_key: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    meta: PaginationMeta
