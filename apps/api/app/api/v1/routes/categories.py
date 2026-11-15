import uuid
from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.core.exceptions import ConflictError, NotFoundError
from app.db.session import get_db
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.ecommerce import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/catalog-categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
async def list_catalog_categories(
    db: AsyncSession = Depends(get_db),
    include_empty: bool = Query(True),
) -> List[CategoryResponse]:
    """Retrieve all categories with active product counts."""
    result = await db.execute(select(Category).order_by(Category.name.asc()))
    categories = result.scalars().all()
    results = []
    for cat in categories:
        count_stmt = select(func.count(Product.id)).where(
            (Product.category_id == cat.id) | (Product.category == cat.name),
            Product.is_active == True,  # noqa: E712
        )
        count = (await db.execute(count_stmt)).scalar() or 0
        if not include_empty and count == 0:
            continue
        results.append(
            CategoryResponse(
                id=cat.id,
                name=cat.name,
                slug=cat.slug,
                description=cat.description,
                image_url=cat.image_url,
                created_at=cat.created_at,
                product_count=count,
            )
        )
    return results


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> CategoryResponse:
    """Create a new category (Admin only)."""
    check_stmt = select(Category).where(
        (Category.slug == payload.slug) | (Category.name == payload.name)
    )
    existing = (await db.execute(check_stmt)).scalar_one_or_none()
    if existing:
        raise ConflictError(f"Category with name '{payload.name}' or slug '{payload.slug}' already exists.")

    cat = Category(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        image_url=payload.image_url,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        image_url=cat.image_url,
        created_at=cat.created_at,
        product_count=0,
    )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    """Delete a category (Admin only)."""
    cat = (await db.execute(select(Category).where(Category.id == category_id))).scalar_one_or_none()
    if not cat:
        raise NotFoundError("Category not found.")
    await db.delete(cat)
    await db.commit()
