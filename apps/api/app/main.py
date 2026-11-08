from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for VestiAI - AI-Powered 2D Virtual Clothing Try-On for E-Commerce",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def root_health_check():
    """
    Root liveness probe for monitoring and load balancers.
    """
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get(f"{settings.API_V1_STR}/health", tags=["System"])
async def api_v1_health_check():
    """
    API v1 health status endpoint.
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "api_prefix": settings.API_V1_STR,
        "storage_backend": settings.STORAGE_BACKEND,
        "model_configured": settings.MODEL_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

