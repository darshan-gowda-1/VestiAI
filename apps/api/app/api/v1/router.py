from fastapi import APIRouter

from app.api.v1.routes import (
    admin_monitor,
    admin_products,
    auth,
    cart,
    categories,
    collections,
    extension,
    health,
    media,
    orders,
    products,
    tryon,
    uploads,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(categories.router)
api_router.include_router(products.categories_router)
api_router.include_router(products.router)
api_router.include_router(admin_products.router)
api_router.include_router(admin_monitor.router)
api_router.include_router(media.router)
api_router.include_router(tryon.router)
api_router.include_router(collections.router)
api_router.include_router(extension.router)
api_router.include_router(uploads.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
