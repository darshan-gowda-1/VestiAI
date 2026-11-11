import uuid
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductRepository:
    """Database access helpers for Product catalog items."""

    @staticmethod
    async def get_by_id(db: AsyncSession, product_id: uuid.UUID) -> Optional[Product]:
        result = await db.execute(select(Product).where(Product.id == product_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_products(
        db: AsyncSession,
        *,
        category: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "featured",
        page: int = 1,
        limit: int = 12,
        include_inactive: bool = False,
    ) -> Tuple[List[Product], int]:
        filters = []
        if not include_inactive:
            filters.append(Product.is_active.is_(True))
        if category and category.lower() != "all":
            filters.append(Product.category == category.lower().strip())
        if search and search.strip():
            term = f"%{search.strip()}%"
            filters.append(
                or_(
                    Product.title.ilike(term),
                    Product.brand.ilike(term),
                    Product.color.ilike(term),
                    Product.material.ilike(term),
                    Product.description.ilike(term),
                )
            )

        count_stmt = select(func.count(Product.id)).where(*filters)
        total = int((await db.execute(count_stmt)).scalar_one() or 0)

        stmt = select(Product).where(*filters)
        if sort == "price_asc":
            stmt = stmt.order_by(Product.price.asc(), Product.created_at.desc())
        elif sort == "price_desc":
            stmt = stmt.order_by(Product.price.desc(), Product.created_at.desc())
        elif sort == "newest":
            stmt = stmt.order_by(Product.created_at.desc())
        elif sort == "title":
            stmt = stmt.order_by(Product.title.asc())
        else:
            stmt = stmt.order_by(Product.is_featured.desc(), Product.created_at.desc())

        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)
        items = list((await db.execute(stmt)).scalars().all())
        return items, total

    @staticmethod
    async def create(db: AsyncSession, payload: ProductCreate) -> Product:
        product = Product(
            title=payload.title.strip(),
            brand=payload.brand.strip(),
            description=payload.description.strip(),
            category=payload.category,
            color=payload.color.strip(),
            price=payload.price,
            material=payload.material.strip() if payload.material else None,
            fit=payload.fit.strip() if payload.fit else None,
            image_key=payload.image_key,
            tryon_image_key=payload.tryon_image_key,
            is_featured=payload.is_featured,
            is_active=True,
        )
        db.add(product)
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def update(db: AsyncSession, product: Product, payload: ProductUpdate) -> Product:
        updates = payload.model_dump(exclude_unset=True)
        for field, value in updates.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(product, field, value)
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def archive(db: AsyncSession, product: Product) -> Product:
        product.is_active = False
        await db.commit()
        await db.refresh(product)
        return product

