# VestiAI 2.0 — Environment Variables Specification

This document lists all configuration variables required across development, staging, and production environments.

---

## 1. Backend API (`apps/api/.env`)

```ini
# Application Core
ENVIRONMENT=production
DEBUG=false
PROJECT_NAME="VestiAI 2.0 API"
API_V1_PREFIX=/api/v1
SECRET_KEY="REPLACE_WITH_STRONG_RANDOM_64_CHAR_HEX"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALGORITHM=HS256

# Database (PostgreSQL)
# Production: postgresql+psycopg2://user:password@render-or-supabase-host:5432/vestiai
DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/vestiai"
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# CORS Whitelist (JSON array or comma-separated URLs)
BACKEND_CORS_ORIGINS=["https://vestiai.vercel.app","http://localhost:5173"]

# Object Storage (Cloudflare R2 - S3 Compatible)
STORAGE_BACKEND="s3"
STORAGE_BUCKET_NAME="vestiai-media"
R2_ACCOUNT_ID="REPLACE_WITH_CLOUDFLARE_R2_ACCOUNT_ID"
R2_ACCESS_KEY_ID="REPLACE_WITH_CLOUDFLARE_R2_ACCESS_KEY_ID"
R2_SECRET_ACCESS_KEY="REPLACE_WITH_CLOUDFLARE_R2_SECRET_ACCESS_KEY"
R2_ENDPOINT_URL="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
PRESIGNED_URL_EXPIRATION_SECONDS=900

# Redis & Background Workers
REDIS_URL="redis://localhost:6379/0"
TRYON_QUEUE_NAME="vestiai:tryon:jobs"

# AI Inference Service (Modal / RunPod / Dedicated GPU)
AI_ADAPTER_TYPE="http_remote"
AI_INFERENCE_URL="https://your-modal-app.modal.run/infer"
AI_INFERENCE_API_KEY="REPLACE_WITH_GPU_SERVICE_BEARER_TOKEN"
AI_INFERENCE_TIMEOUT_SECONDS=60
```

---

## 2. Frontend Web Application (`apps/web/.env.production`)

```ini
# API Gateway Endpoint
VITE_API_URL="https://vestiai-api.onrender.com"
VITE_API_BASE_URL="https://vestiai-api.onrender.com/api/v1"

# Environment & Features
VITE_APP_NAME="VestiAI 2.0"
VITE_ENABLE_CAMERA=true
VITE_ENABLE_ANALYTICS=false
```

---

## 3. Chrome Extension (`apps/extension/.env`)

```ini
# Backend API target for extension
VITE_API_URL="https://vestiai-api.onrender.com/api/v1"
```

---

## 4. Dedicated GPU Inference Container (Modal / RunPod)

```ini
# GPU Inference Container Variables
MODEL_NAME="yisol/IDM-VTON"
TORCH_DTYPE="float16"
DEVICE="cuda"
AUTH_BEARER_TOKEN="REPLACE_WITH_STRONG_SECRET_MATCHING_AI_INFERENCE_API_KEY"
MAX_BATCH_SIZE=1
ENABLE_XFORMERS=true
```
