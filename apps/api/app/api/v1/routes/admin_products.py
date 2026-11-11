import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.admin_audit_log import AdminAuditLog
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)
from app.services.catalog_service import CatalogService
from app.services.image_validation import validate_and_sanitize_image
from app.services.storage_service import get_storage_backend

router = APIRouter(prefix="/admin/products", tags=["Admin Catalog"])


@router.get("", response_model=ProductListResponse)
async def admin_list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None, max_length=100),
    sort: Literal["featured", "price_asc", "price_desc", "newest", "title"] = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    include_inactive: bool = Query(True),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProductListResponse:
    """Admin view of catalog products including archived items."""
    return await CatalogService.list_products(
        db,
        category=category,
        search=search,
        sort=sort,
        page=page,
        limit=limit,
        include_inactive=include_inactive,
    )


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_product(
    payload: ProductCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Create a new catalog product (Admin only)."""
    product = await CatalogService.create_product(db, payload, admin)
    return ProductResponse.model_validate(product)


@router.patch("/{product_id}", response_model=ProductResponse)
async def admin_update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Update product fields or active state (Admin only)."""
    product = await CatalogService.update_product(db, product_id, payload, admin)
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", response_model=ProductResponse)
async def admin_archive_product(
    product_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Soft-archive a product by setting is_active=False (Admin only)."""
    product = await CatalogService.archive_product(db, product_id, admin)
    return ProductResponse.model_validate(product)


@router.post("/{product_id}/image", response_model=ProductResponse)
async def admin_upload_product_image(
    product_id: uuid.UUID,
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Upload and validate a flat-lay garment image for a catalog product (Admin only)."""
    product = await CatalogService.get_product(db, product_id, allow_inactive=True)
    validated = await validate_and_sanitize_image(file)

    storage = get_storage_backend()
    object_key = f"catalog/{product.id}_{uuid.uuid4().hex}{validated.extension}"
    stored_key = storage.put_object(object_key, validated.content, validated.content_type)

    product.image_key = stored_key
    product.tryon_image_key = stored_key
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="UPLOAD_PRODUCT_IMAGE",
            entity_type="product",
            entity_id=str(product.id),
            summary=f"Uploaded product image ({validated.width}x{validated.height})",
        )
    )
    await db.commit()
    await db.refresh(product)
    return ProductResponse.model_validate(product)
