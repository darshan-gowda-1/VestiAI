import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, logger
from app.db.session import AsyncSessionLocal, engine
from app.schemas.common import ErrorResponse
from app.services.catalog_service import CatalogService, SAMPLE_CATALOG_ITEMS
from app.services.storage_service import get_storage_backend


def _render_seed_garment_png(category: str, color_name: str) -> bytes:
    """Render a minimal 768x1024 flat-lay garment PNG when seeding cloud storage."""
    from io import BytesIO
    from PIL import Image, ImageDraw

    color_map = {
        "Navy Blue": (30, 58, 95),
        "Warm Off-White": (239, 236, 230),
        "Sky Blue": (142, 174, 201),
        "Olive Green": (92, 109, 83),
        "Crisp White": (250, 249, 246),
        "Charcoal Grey": (51, 53, 57),
        "Heather Grey": (163, 166, 172),
        "Forest Green": (43, 67, 54),
        "Champagne Beige": (229, 214, 197),
        "Midnight Black": (31, 31, 36),
        "Navy & White Stripe": (34, 59, 96),
        "Earthy Terracotta": (168, 90, 50),
    }
    img = Image.new("RGB", (768, 1024), (248, 247, 244))
    draw = ImageDraw.Draw(img)
    fill = color_map.get(color_name, (60, 75, 95))
    outline = (42, 42, 42)
    if category == "sweatshirt":
        points = [(240, 220), (140, 320), (70, 620), (170, 650), (225, 430), (225, 860), (543, 860), (543, 430), (598, 650), (698, 620), (628, 320), (528, 220)]
    elif category == "shirt":
        points = [(245, 210), (150, 290), (85, 580), (175, 605), (225, 410), (225, 860), (543, 860), (543, 410), (593, 605), (683, 580), (618, 290), (523, 210)]
    elif category == "blouse":
        points = [(255, 220), (175, 310), (110, 520), (200, 545), (235, 410), (235, 850), (533, 850), (533, 410), (568, 545), (658, 520), (593, 310), (513, 220)]
    else:
        points = [(245, 210), (165, 300), (100, 460), (195, 505), (230, 405), (230, 840), (538, 840), (538, 405), (573, 505), (668, 460), (603, 300), (523, 210)]
    draw.polygon(points, fill=fill, outline=outline, width=4)
    draw.arc([305, 190, 463, 275], start=0, end=180, fill=(248, 247, 244), width=8)
    buf = BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(debug=settings.DEBUG)
    if (
        settings.ENVIRONMENT.lower() == "production"
        and settings.AUTH_SECRET_KEY.startswith("change_this_")
    ):
        raise RuntimeError(
            "Insecure default AUTH_SECRET_KEY detected in production environment."
        )
    if settings.AUTO_SEED_CATALOG:
        try:
            async with AsyncSessionLocal() as db:
                seeded = await CatalogService.seed_sample_catalog(db)
            if seeded > 0:
                storage = get_storage_backend()
                for item in SAMPLE_CATALOG_ITEMS:
                    storage.put_object(
                        item["image_key"],
                        _render_seed_garment_png(item["category"], item["color"]),
                        content_type="image/png",
                    )
                logger.info("Auto-seeded %s sample catalog products and media assets.", seeded)
        except Exception as exc:
            logger.warning("Auto-seed catalog skipped: %s", exc)
    logger.info("Starting %s in %s mode", settings.APP_NAME, settings.ENVIRONMENT)
    yield
    await engine.dispose()
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for VestiAI - AI-Powered 2D Virtual Clothing Try-On for E-Commerce",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)

# Register standardized error handlers ({code, message, request_id})
register_exception_handlers(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_and_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.perf_counter()

    response = await call_next(request)

    duration_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    logger.info(
        "request_id=%s method=%s path=%s status=%s duration_ms=%.2f",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.get("/health", tags=["System"])
async def root_health_check():
    """Root liveness probe for monitoring and load balancers."""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
