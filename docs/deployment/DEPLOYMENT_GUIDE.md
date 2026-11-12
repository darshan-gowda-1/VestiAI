# VestiAI Deployment & Operations Guide

This guide covers containerized local production deployment, cloud deployment (Vercel + Render + Cloudflare R2 + Remote GPU Worker), environment configuration, database migrations, and operational maintenance.

---

## 1. Production Environment Checklist

Before deploying VestiAI in `production` mode, verify all required environment variables:

| Variable | Required Value / Guidance |
| :--- | :--- |
| `ENVIRONMENT` | `production` (enables strict startup secret validation in `app/main.py`) |
| `DEBUG` | `False` |
| `AUTH_SECRET_KEY` | Strong 64-char hex secret (`openssl rand -hex 32`). Startup fails if left at `change_this_...`. |
| `CORS_ORIGINS` | JSON array of deployed frontend origins (e.g., `["https://vestiai.vercel.app"]`) |
| `DATABASE_URL` | `postgresql+asyncpg://<user>:<password>@<host>:5432/<db>` |
| `SYNC_DATABASE_URL` | `postgresql://<user>:<password>@<host>:5432/<db>` (used by Alembic) |
| `REDIS_URL` | `redis://<host>:6379/0` |
| `STORAGE_BACKEND` | `s3` (recommended for cloud) or `local` (with persistent Docker volume) |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Required when `STORAGE_BACKEND=s3` (Cloudflare R2 or AWS S3) |
| `MODEL_NAME` | `remote` (when delegating to Colab/HF Space GPU worker), `idm-vton`, `catvton`, or `stub` |
| `REMOTE_INFERENCE_URL` | HTTPS URL of the running GPU inference endpoint when `MODEL_NAME=remote` |
| `VITE_API_BASE_URL` | Public backend API base URL (e.g., `https://vestiai-api.onrender.com/api/v1`) or `/api/v1` behind Nginx |

---

## 2. Full-Stack Docker Compose Deployment (`docker-compose.prod.yml`)

The production compose file runs `postgres`, `redis`, a one-shot `migrate` container (`alembic upgrade head`), `api` (`uvicorn`), `worker` (`python -m app.workers.tryon_worker`), and `web` (Nginx serving the built Vite SPA + reverse-proxying `/api/` and `/health`).

### Startup Commands
```bash
# 1. Create a production .env from template and set a real AUTH_SECRET_KEY
cp .env.example .env

# 2. Build and start the full production stack
docker compose -f docker-compose.prod.yml up --build -d

# 3. Seed sample tops catalog (first deployment only)
docker compose -f docker-compose.prod.yml exec api python /app/scripts/seed_catalog.py
```
*(Note: When running outside Docker or mounting `scripts/`, run `python scripts/seed_catalog.py` from the repository root with `DATABASE_URL` configured.)*

### Health Verification
- Frontend SPA: `http://localhost/`
- API Health Probe: `http://localhost/health` or `http://localhost:8000/health`
- Swagger API Docs: `http://localhost:8000/docs`

---

## 3. Cloud Deployment Architecture (Free / Low-Cost Academic Tier)

1. **Frontend (`apps/web` -> Vercel):**
   - Root Directory: `apps/web`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_BASE_URL=https://<your-render-api>.onrender.com/api/v1`
   - SPA routing & security headers are configured in `apps/web/vercel.json`.

2. **Backend API, Worker, PostgreSQL & Redis (`infra/deploy/render.yaml` -> Render):**
   - Connect the repository as a Render Blueprint using `infra/deploy/render.yaml`.
   - Provisions `vestiai-db` (PostgreSQL), `vestiai-redis` (Redis), `vestiai-api` (`apps/api/Dockerfile`), and `vestiai-worker` (`python -m app.workers.tryon_worker`).
   - Set `CORS_ORIGINS`, `S3_*` (Cloudflare R2), and `REMOTE_INFERENCE_URL` in Render environment settings.

3. **Object Storage (Cloudflare R2):**
   - Create a **private** bucket (no public read access; media is served via signed URLs from `/api/v1/media/*`).
   - Set `STORAGE_BACKEND=s3` and configure `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY`.

4. **GPU Inference Worker (Google Colab / Hugging Face Space):**
   - Launch `docs/model-evaluation/VestiAI_TryOn_Colab.ipynb` on a T4 GPU runtime and paste the exposed inference URL into `REMOTE_INFERENCE_URL`.

---

## 4. Database Migrations & Scheduled Maintenance

- **Apply Migrations:**
  ```bash
  cd apps/api
  alembic upgrade head
  ```
- **Expired Media Retention Cleanup (`RESULT_RETENTION_DAYS`):**
  Run `scripts/cleanup_media.py` on a daily cron or scheduled job to purge expired temporary uploads and old try-on outputs:
  ```bash
  python scripts/cleanup_media.py
  ```

---

## 5. CI/CD Pipeline (`.github/workflows/ci.yml`)

Every push and pull request to `master` or `main` automatically runs:
- **Backend Job:** Python 3.12 setup, `pip install -r requirements.txt`, and `pytest -v`.
- **Frontend Job:** Node.js 20 setup, `npm ci`, `npm test` (Vitest), `npm run lint` (`tsc --noEmit`), and `npm run build` (`vite build`).

