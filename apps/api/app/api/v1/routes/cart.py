from decimal import Decimal
from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.ecommerce import (
    CartItemAdd,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
)
from app.services.storage_service import get_storage_backend

router = APIRouter(prefix="/cart", tags=["Cart"])


async def _get_or_create_cart(db: AsyncSession, user_id: uuid.UUID) -> Cart:
    stmt = select(Cart).where(Cart.user_id == user_id)
    cart = (await db.execute(stmt)).scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
    return cart


async def _build_cart_response(db: AsyncSession, cart_id: uuid.UUID) -> CartResponse:
    storage = get_storage_backend()
    stmt = select(CartItem).where(CartItem.cart_id == cart_id).order_by(CartItem.created_at.asc())
    items = (await db.execute(stmt)).scalars().all()

    items_out = []
    subtotal = Decimal("0.00")
    total_qty = 0

    for item in items:
        prod_stmt = select(Product).where(Product.id == item.product_id)
        product = (await db.execute(prod_stmt)).scalar_one_or_none()
        if not product:
            continue

        price = product.discount_price if product.discount_price is not None else product.price
        item_total = price * item.quantity
        subtotal += item_total
        total_qty += item.quantity
        image_url = storage.generate_signed_url(product.image_key)

        items_out.append(
            CartItemResponse(
                id=item.id,
                product_id=product.id,
                product_title=product.title,
                product_image_url=image_url,
                price=price,
                quantity=item.quantity,
                selected_size=item.selected_size,
                item_total=item_total,
            )
        )

    return CartResponse(
        id=cart_id,
        items=items_out,
        subtotal=subtotal,
        item_count=total_qty,
    )


@router.get("", response_model=CartResponse)
async def get_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    """Retrieve the current user's shopping cart."""
    cart = await _get_or_create_cart(db, current_user.id)
    return await _build_cart_response(db, cart.id)


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_cart(
    payload: CartItemAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    """Add a product with selected size to the shopping cart."""
    stmt_prod = select(Product).where(Product.id == payload.product_id, Product.is_active == True)
    product = (await db.execute(stmt_prod)).scalar_one_or_none()
    if not product:
        raise NotFoundError("Product not found or inactive.")

    cart = await _get_or_create_cart(db, current_user.id)

    stmt_item = select(CartItem).where(
        CartItem.cart_id == cart.id,
        CartItem.product_id == payload.product_id,
        CartItem.selected_size == payload.selected_size,
    )
    existing_item = (await db.execute(stmt_item)).scalar_one_or_none()

    if existing_item:
        existing_item.quantity += payload.quantity
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=payload.product_id,
            quantity=payload.quantity,
            selected_size=payload.selected_size,
        )
        db.add(new_item)

    await db.commit()
    return await _build_cart_response(db, cart.id)


@router.put("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: uuid.UUID,
    payload: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    """Update quantity or selected size of a cart item."""
    cart = await _get_or_create_cart(db, current_user.id)
    stmt_item = select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    item = (await db.execute(stmt_item)).scalar_one_or_none()
    if not item:
        raise NotFoundError("Cart item not found.")

    item.quantity = payload.quantity
    if payload.selected_size:
        item.selected_size = payload.selected_size

    await db.commit()
    return await _build_cart_response(db, cart.id)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    """Remove an item from the cart."""
    cart = await _get_or_create_cart(db, current_user.id)
    stmt_item = select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    item = (await db.execute(stmt_item)).scalar_one_or_none()
    if not item:
        raise NotFoundError("Cart item not found.")

    await db.delete(item)
    await db.commit()
    return await _build_cart_response(db, cart.id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Clear all items from the current user's shopping cart."""
    cart = await _get_or_create_cart(db, current_user.id)
    stmt_items = select(CartItem).where(CartItem.cart_id == cart.id)
    items = (await db.execute(stmt_items)).scalars().all()
    for item in items:
        await db.delete(item)
    await db.commit()
