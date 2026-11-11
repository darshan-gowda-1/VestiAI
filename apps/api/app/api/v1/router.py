from fastapi import APIRouter

from app.api.v1.routes import admin_products, auth, health, media, products, tryon, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(products.router)
api_router.include_router(admin_products.router)
api_router.include_router(media.router)
api_router.include_router(tryon.router)
