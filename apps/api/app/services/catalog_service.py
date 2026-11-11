from decimal import Decimal
import math
from typing import Optional
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.admin_audit_log import AdminAuditLog
from app.models.product import Product
from app.models.user import User
from app.repositories.product_repository import ProductRepository
from app.schemas.common import PaginationMeta
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)

SAMPLE_CATALOG_ITEMS = [
    {
        "title": "Classic Heavyweight Cotton Crewneck",
        "brand": "Atelier Vesti",
        "category": "t-shirt",
        "color": "Navy Blue",
        "price": Decimal("45.00"),
        "material": "100% Combed Organic Cotton",
        "fit": "Standard Regular Fit",
        "description": "Structured 280 GSM cotton crewneck tailored with double-needle stitching and a pre-shrunk finish.",
        "image_key": "catalog/prod-001.png",
        "tryon_image_key": "catalog/prod-001.png",
        "is_featured": True,
    },
    {
        "title": "Minimalist Relaxed Boxy Tee",
        "brand": "Studio Drape",
        "category": "t-shirt",
        "color": "Warm Off-White",
        "price": Decimal("42.00"),
        "material": "100% Peruvian Pima Cotton",
        "fit": "Boxy / Relaxed Fit",
        "description": "Crafted with a relaxed drop-shoulder cut in breathable single jersey fabric for effortless layering.",
        "image_key": "catalog/prod-002.png",
        "tryon_image_key": "catalog/prod-002.png",
        "is_featured": True,
    },
    {
        "title": "Tailored Oxford Cotton Button-Down",
        "brand": "Loom & Thread",
        "category": "shirt",
        "color": "Sky Blue",
        "price": Decimal("85.00"),
        "material": "100% Long-Staple Cotton",
        "fit": "Tailored Slim Fit",
        "description": "Essential formal button-down shirt woven with basketweave Oxford cloth and mother-of-pearl buttons.",
        "image_key": "catalog/prod-003.png",
        "tryon_image_key": "catalog/prod-003.png",
        "is_featured": True,
    },
    {
        "title": "Modern Washed Linen Resort Shirt",
        "brand": "Solstice Goods",
        "category": "shirt",
        "color": "Olive Green",
        "price": Decimal("92.00"),
        "material": "100% French Flax Linen",
        "fit": "Relaxed Resort Fit",
        "description": "Garment-dyed French linen with an open camp collar, naturally breathable and textured.",
        "image_key": "catalog/prod-004.png",
        "tryon_image_key": "catalog/prod-004.png",
        "is_featured": False,
    },
    {
        "title": "Crisp Poplin Evening Dress Shirt",
        "brand": "Atelier Vesti",
        "category": "shirt",
        "color": "Crisp White",
        "price": Decimal("110.00"),
        "material": "100% Egyptian Cotton Poplin",
        "fit": "Classic Tailored Fit",
        "description": "Fine 120s two-ply cotton poplin shirt featuring a spread collar and French cuffs.",
        "image_key": "catalog/prod-005.png",
        "tryon_image_key": "catalog/prod-005.png",
        "is_featured": False,
    },
    {
        "title": "Brushed French Terry Pullover",
        "brand": "Studio Drape",
        "category": "sweatshirt",
        "color": "Charcoal Grey",
        "price": Decimal("78.00"),
        "material": "90% Cotton, 10% Recycled Polyester",
        "fit": "Relaxed Athleisure Fit",
        "description": "Heavyweight 400 GSM brushed fleece with ribbed side gussets for mobility and warmth.",
        "image_key": "catalog/prod-006.png",
        "tryon_image_key": "catalog/prod-006.png",
        "is_featured": True,
    },
    {
        "title": "Vintage Drop-Shoulder Sweatshirt",
        "brand": "Loom & Thread",
        "category": "sweatshirt",
        "color": "Heather Grey",
        "price": Decimal("72.00"),
        "material": "100% Ring-Spun Cotton Fleece",
        "fit": "Oversized Fit",
        "description": "Classic collegiate crewneck with vintage V-insert collar stitching and reinforced ribbed cuffs.",
        "image_key": "catalog/prod-007.png",
        "tryon_image_key": "catalog/prod-007.png",
        "is_featured": False,
    },
    {
        "title": "Deep Forest Pine Crew Sweatshirt",
        "brand": "Solstice Goods",
        "category": "sweatshirt",
        "color": "Forest Green",
        "price": Decimal("80.00"),
        "material": "100% Organic Cotton",
        "fit": "Regular Fit",
        "description": "Garment-washed organic fleece dyed in an earthy dark pine shade with soft loopback interior.",
        "image_key": "catalog/prod-008.png",
        "tryon_image_key": "catalog/prod-008.png",
        "is_featured": False,
    },
    {
        "title": "Silk Crepe de Chine Drape Blouse",
        "brand": "Maison Ethereal",
        "category": "blouse",
        "color": "Champagne Beige",
        "price": Decimal("135.00"),
        "material": "100% Mulberry Silk",
        "fit": "Fluid Flowing Fit",
        "description": "Lustrous 16mm mulberry silk blouse with subtle pleats along the neckline and raglan sleeves.",
        "image_key": "catalog/prod-009.png",
        "tryon_image_key": "catalog/prod-009.png",
        "is_featured": True,
    },
    {
        "title": "Pleated High-Neck Evening Blouse",
        "brand": "Maison Ethereal",
        "category": "blouse",
        "color": "Midnight Black",
        "price": Decimal("120.00"),
        "material": "70% Viscose, 30% Silk",
        "fit": "Fitted Silhouette",
        "description": "Architectural high collar with concealed back keyhole closure and flared bell cuffs.",
        "image_key": "catalog/prod-010.png",
        "tryon_image_key": "catalog/prod-010.png",
        "is_featured": False,
    },
    {
        "title": "Breton Striped Nautical Top",
        "brand": "Atelier Vesti",
        "category": "t-shirt",
        "color": "Navy & White Stripe",
        "price": Decimal("52.00"),
        "material": "100% Organic Cotton Jersey",
        "fit": "Straight Fit",
        "description": "Knitted from dense combed cotton yarn with clean horizontal maritime stripe sequencing.",
        "image_key": "catalog/prod-011.png",
        "tryon_image_key": "catalog/prod-011.png",
        "is_featured": False,
    },
    {
        "title": "Terracotta Linen Camp-Collar Shirt",
        "brand": "Solstice Goods",
        "category": "shirt",
        "color": "Earthy Terracotta",
        "price": Decimal("88.00"),
        "material": "100% Pure Washed Linen",
        "fit": "Relaxed Fit",
        "description": "Vibrant washed linen shirt with a relaxed notched collar and square hem.",
        "image_key": "catalog/prod-012.png",
        "tryon_image_key": "catalog/prod-012.png",
        "is_featured": True,
    },
]


class CatalogService:
    """Business logic for catalog querying, admin CRUD, and seeding."""

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
    ) -> ProductListResponse:
        items, total = await ProductRepository.list_products(
            db,
            category=category,
            search=search,
            sort=sort,
            page=page,
            limit=limit,
            include_inactive=include_inactive,
        )
        total_pages = math.ceil(total / limit) if total > 0 else 0
        return ProductListResponse(
            items=[ProductResponse.model_validate(item) for item in items],
            meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
        )

    @staticmethod
    async def get_product(
        db: AsyncSession,
        product_id: uuid.UUID,
        *,
        allow_inactive: bool = False,
    ) -> Product:
        product = await ProductRepository.get_by_id(db, product_id)
        if product is None or (not allow_inactive and not product.is_active):
            raise NotFoundError("Product not found.")
        return product

    @staticmethod
    async def create_product(
        db: AsyncSession,
        payload: ProductCreate,
        admin: User,
    ) -> Product:
        product = await ProductRepository.create(db, payload)
        db.add(
            AdminAuditLog(
                admin_id=admin.id,
                action="CREATE_PRODUCT",
                entity_type="product",
                entity_id=str(product.id),
                summary=f"Created product '{product.title}'",
            )
        )
        await db.commit()
        return product

    @staticmethod
    async def update_product(
        db: AsyncSession,
        product_id: uuid.UUID,
        payload: ProductUpdate,
        admin: User,
    ) -> Product:
        product = await CatalogService.get_product(db, product_id, allow_inactive=True)
        updated = await ProductRepository.update(db, product, payload)
        db.add(
            AdminAuditLog(
                admin_id=admin.id,
                action="UPDATE_PRODUCT",
                entity_type="product",
                entity_id=str(updated.id),
                summary=f"Updated product '{updated.title}'",
            )
        )
        await db.commit()
        return updated

    @staticmethod
    async def archive_product(
        db: AsyncSession,
        product_id: uuid.UUID,
        admin: User,
    ) -> Product:
        product = await CatalogService.get_product(db, product_id, allow_inactive=True)
        archived = await ProductRepository.archive(db, product)
        db.add(
            AdminAuditLog(
                admin_id=admin.id,
                action="ARCHIVE_PRODUCT",
                entity_type="product",
                entity_id=str(archived.id),
                summary=f"Archived product '{archived.title}'",
            )
        )
        await db.commit()
        return archived

    @staticmethod
    async def seed_sample_catalog(db: AsyncSession) -> int:
        """Idempotently seed the 12 sample upper-body garments if the catalog is empty."""
        existing_count = (await db.execute(select(func.count(Product.id)))).scalar_one()
        if existing_count and existing_count > 0:
            return 0
        for item in SAMPLE_CATALOG_ITEMS:
            db.add(Product(**item, is_active=True))
        await db.commit()
        return len(SAMPLE_CATALOG_ITEMS)

