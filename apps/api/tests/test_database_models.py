import uuid
from decimal import Decimal
import pytest
import pytest_asyncio
from sqlalchemy import event, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base, utc_now
from app.models import (
    AdminAuditLog,
    ConsentRecord,
    Product,
    SavedLook,
    TryOnJob,
    User,
    WishlistItem,
)
from app.schemas import ProductCreate, ProductResponse, UserCreate


@pytest_asyncio.fixture
async def async_db_session():
    """Provide a clean async SQLite database with foreign keys enabled for each test."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_create_all_models_and_relationships(async_db_session: AsyncSession):
    # 1. Create User & Admin
    user = User(
        email="shopper@vestiai.test",
        full_name="Test Shopper",
        password_hash="hashed_secret_pw",
        role="user",
    )
    admin = User(
        email="admin@vestiai.test",
        full_name="Test Admin",
        password_hash="hashed_admin_pw",
        role="admin",
    )
    async_db_session.add_all([user, admin])
    await async_db_session.flush()

    # 2. Create Product
    product = Product(
        title="Classic Heavyweight Cotton Crewneck",
        brand="Atelier Vesti",
        description="Structured 280 GSM cotton crewneck.",
        category="t-shirt",
        color="Navy Blue",
        price=Decimal("45.00"),
        material="100% Organic Cotton",
        fit="Regular Fit",
        image_key="catalog/prod-001.png",
        tryon_image_key="catalog/prod-001-flat.png",
        is_featured=True,
        is_active=True,
    )
    async_db_session.add(product)
    await async_db_session.flush()

    # 3. Create TryOnJob
    job = TryOnJob(
        user_id=user.id,
        product_id=product.id,
        status="completed",
        person_image_key="user-uploads/person-1.png",
        garment_image_key=product.tryon_image_key,
        result_image_key="tryon-results/result-1.png",
        category="upper_body",
        consent_at=utc_now(),
        model_name="idm-vton",
        processing_time_ms=3450.5,
    )
    async_db_session.add(job)
    await async_db_session.flush()

    # 4. Create SavedLook, WishlistItem, ConsentRecord, AdminAuditLog
    saved_look = SavedLook(user_id=user.id, job_id=job.id)
    wishlist_item = WishlistItem(user_id=user.id, product_id=product.id)
    consent = ConsentRecord(
        user_id=user.id,
        job_id=job.id,
        consent_version="v1.0",
        consent_at=utc_now(),
        purpose="2d_virtual_tryon_processing",
    )
    audit = AdminAuditLog(
        admin_id=admin.id,
        action="CREATE_PRODUCT",
        entity_type="product",
        entity_id=str(product.id),
        summary="Created Classic Heavyweight Cotton Crewneck",
    )
    async_db_session.add_all([saved_look, wishlist_item, consent, audit])
    await async_db_session.commit()

    # Verify queries
    fetched_job = (
        await async_db_session.execute(select(TryOnJob).where(TryOnJob.id == job.id))
    ).scalar_one()
    assert fetched_job.user_id == user.id
    assert fetched_job.product_id == product.id
    assert fetched_job.status == "completed"

    # Verify schema serialization
    product_schema = ProductResponse.model_validate(product)
    assert product_schema.title == "Classic Heavyweight Cotton Crewneck"
    assert product_schema.price == Decimal("45.00")


@pytest.mark.asyncio
async def test_unique_constraints(async_db_session: AsyncSession):
    user1 = User(email="dup@vestiai.test", password_hash="hash1")
    async_db_session.add(user1)
    await async_db_session.commit()

    user2 = User(email="dup@vestiai.test", password_hash="hash2")
    async_db_session.add(user2)
    with pytest.raises(IntegrityError):
        await async_db_session.commit()
    await async_db_session.rollback()


@pytest.mark.asyncio
async def test_user_deletion_cascades(async_db_session: AsyncSession):
    user = User(email="cascade@vestiai.test", password_hash="hash")
    product = Product(
        title="Test Oxford Shirt",
        description="Cotton button-down shirt.",
        category="shirt",
        color="Sky Blue",
        price=Decimal("85.00"),
        image_key="catalog/shirt.png",
        tryon_image_key="catalog/shirt-flat.png",
    )
    async_db_session.add_all([user, product])
    await async_db_session.flush()

    job = TryOnJob(
        user_id=user.id,
        product_id=product.id,
        status="queued",
        person_image_key="u/p.png",
        garment_image_key=product.tryon_image_key,
        consent_at=utc_now(),
    )
    async_db_session.add(job)
    await async_db_session.flush()

    wishlist = WishlistItem(user_id=user.id, product_id=product.id)
    async_db_session.add(wishlist)
    await async_db_session.commit()

    # Delete user and confirm cascade removes job and wishlist, leaving product intact
    await async_db_session.delete(user)
    await async_db_session.commit()

    jobs_left = (await async_db_session.execute(select(TryOnJob))).scalars().all()
    wishlists_left = (await async_db_session.execute(select(WishlistItem))).scalars().all()
    products_left = (await async_db_session.execute(select(Product))).scalars().all()

    assert len(jobs_left) == 0
    assert len(wishlists_left) == 0
    assert len(products_left) == 1


def test_pydantic_validation_schemas():
    valid_prod = ProductCreate(
        title="Linen Shirt",
        description="Breathable summer linen shirt.",
        category="shirt",
        color="Olive",
        price=Decimal("92.00"),
        image_key="catalog/linen.png",
        tryon_image_key="catalog/linen-flat.png",
    )
    assert valid_prod.category == "shirt"

    with pytest.raises(Exception):
        UserCreate(email="not-an-email", password="short")

