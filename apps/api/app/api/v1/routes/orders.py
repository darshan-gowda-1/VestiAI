from decimal import Decimal
from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.db.session import get_db
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.ecommerce import (
    OrderCheckoutRequest,
    OrderItemResponse,
    OrderResponse,
)
from app.services.storage_service import get_storage_backend

router = APIRouter(prefix="/orders", tags=["Orders"])


async def _build_order_response(db: AsyncSession, order: Order) -> OrderResponse:
    storage = get_storage_backend()
    stmt = select(OrderItem).where(OrderItem.order_id == order.id).order_by(OrderItem.id.asc())
    items = (await db.execute(stmt)).scalars().all()

    items_out = []
    for item in items:
        image_url = storage.generate_signed_url(item.product_image_key) if item.product_image_key else ""
        items_out.append(
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_title=item.product_title,
                product_image_key=item.product_image_key,
                product_image_url=image_url,
                quantity=item.quantity,
                selected_size=item.selected_size,
                unit_price=item.unit_price,
                total_price=item.unit_price * item.quantity,
            )
        )
    return OrderResponse(
        id=order.id,
        total_amount=order.total_amount,
        currency=order.currency,
        order_status=order.order_status,
        payment_status=order.payment_status,
        shipping_address=order.shipping_address,
        created_at=order.created_at,
        items=items_out,
    )


@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def checkout_cart(
    payload: OrderCheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderResponse:
    """Transform user's current shopping cart into a confirmed order."""
    cart_stmt = select(Cart).where(Cart.user_id == current_user.id)
    cart = (await db.execute(cart_stmt)).scalar_one_or_none()
    if not cart:
        raise BadRequestError("Cart is empty. Add items before checking out.")

    items_stmt = select(CartItem).where(CartItem.cart_id == cart.id)
    cart_items = (await db.execute(items_stmt)).scalars().all()
    if not cart_items:
        raise BadRequestError("Cart is empty. Add items before checking out.")

    total_amount = Decimal("0.00")
    order_items_to_create = []

    for item in cart_items:
        prod_stmt = select(Product).where(Product.id == item.product_id)
        product = (await db.execute(prod_stmt)).scalar_one_or_none()
        if not product:
            continue
        unit_price = product.discount_price if product.discount_price is not None else product.price
        total_amount += unit_price * item.quantity

        order_items_to_create.append(
            OrderItem(
                product_id=product.id,
                product_title=product.title,
                product_image_key=product.image_key,
                quantity=item.quantity,
                selected_size=item.selected_size,
                unit_price=unit_price,
            )
        )

    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        currency="USD",
        order_status="confirmed",
        payment_status="paid",
        shipping_address=payload.shipping_address,
    )
    db.add(order)
    await db.flush()

    for oi in order_items_to_create:
        oi.order_id = order.id
        db.add(oi)

    # Empty user's cart
    for item in cart_items:
        await db.delete(item)

    await db.commit()
    await db.refresh(order)
    return await _build_order_response(db, order)


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[OrderResponse]:
    """Retrieve all purchase orders for the current user."""
    stmt = select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    orders = (await db.execute(stmt)).scalars().all()
    return [await _build_order_response(db, o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_detail(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderResponse:
    """Retrieve a specific order by ID."""
    stmt = select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
    order = (await db.execute(stmt)).scalar_one_or_none()
    if not order:
        raise NotFoundError("Order not found.")
    return await _build_order_response(db, order)
