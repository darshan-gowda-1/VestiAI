import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.product import ProductListResponse, ProductResponse
from app.services.catalog_service import CatalogService

router = APIRouter(prefix="/products", tags=["Catalog"])
categories_router = APIRouter(tags=["Catalog"])


@categories_router.get("/categories")
async def list_categories() -> list[dict]:
    """Return supported upper-body garment categories."""
    return [
        {"id": "t-shirt", "label": "T-Shirts"},
        {"id": "shirt", "label": "Shirts"},
        {"id": "sweatshirt", "label": "Sweatshirts"},
        {"id": "blouse", "label": "Blouses"},
    ]


@router.get("", response_model=ProductListResponse)
async def list_products(
    category: Optional[str] = Query(None, description="Filter by category (t-shirt, shirt, sweatshirt, blouse)"),
    search: Optional[str] = Query(None, max_length=100, description="Search title, brand, color, or material"),
    sort: Literal["featured", "price_asc", "price_desc", "newest", "title"] = Query("featured"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> ProductListResponse:
    """List active catalog products with filtering, search, sorting, and pagination."""
    return await CatalogService.list_products(
        db,
        category=category,
        search=search,
        sort=sort,
        page=page,
        limit=limit,
        include_inactive=False,
    )


@router.get("/search", response_model=ProductListResponse)
async def search_products(
    q: Optional[str] = Query(None, max_length=100, description="Search keyword"),
    category: Optional[str] = Query(None),
    sort: Literal["featured", "price_asc", "price_desc", "newest", "title"] = Query("featured"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> ProductListResponse:
    """Search active catalog products by keyword."""
    return await CatalogService.list_products(
        db,
        category=category,
        search=q,
        sort=sort,
        page=page,
        limit=limit,
        include_inactive=False,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product_detail(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Retrieve details for an active product."""
    product = await CatalogService.get_product(db, product_id, allow_inactive=False)
    return ProductResponse.model_validate(product)

