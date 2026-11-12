# VestiAI: AI-Powered 2D Virtual Clothing Try-On for E-Commerce

**College Mini-Project Final Report**

---

## Abstract

Online apparel shoppers frequently face uncertainty when purchasing upper-body garments because flat product photographs and studio mannequins do not reflect how a garment will appear on an individual's own frame. **VestiAI** addresses this gap through a full-stack, consent-first 2D virtual clothing try-on web application focused specifically on upper-body tops (`t-shirt`, `shirt`, `sweatshirt`, and `blouse`). Built with React 18, TypeScript, Tailwind CSS, FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 16, Redis 7, and a pluggable 2D diffusion inference adapter (`IDM-VTON` / remote Colab GPU worker / deterministic CPU test stub), VestiAI decouples heavy AI inference from web requests using an asynchronous background worker architecture. The platform enforces explicit user image-processing consent, private signed-URL media delivery, strict binary image validation, rate limiting, and complete user data deletion rights, while remaining transparent that 2D image-to-image synthesis is a visual preview tool rather than a 3D physical sizing guarantee.

---

## 1. Introduction & Problem Statement

### 1.1 Background
E-commerce fashion platforms experience high return rates driven in part by visual mismatch—shoppers cannot easily judge neckline, sleeve drape, print placement, or overall silhouette against their own body from catalog thumbnails alone.

### 1.2 Problem Statement
Design and implement a responsive, privacy-preserving web platform that allows shoppers to:
1. Browse an upper-body garment catalog (`t-shirt`, `shirt`, `sweatshirt`, `blouse`).
2. Grant explicit consent and upload a front-facing upper-body photograph with real-time guidance and validation.
3. Submit an asynchronous virtual try-on job without blocking the HTTP server.
4. Inspect the generated 2D try-on output using an interactive before/after comparison slider, save favorite looks, and delete personal media/jobs at any time.

### 1.3 Strict Scope & Honest Limitations
- **In Scope:** 2D image-to-image upper-body garment transfer (`t-shirt`, `shirt`, `sweatshirt`, `blouse`), asynchronous job lifecycle (`queued` -> `processing` -> `completed` / `failed`), catalog management, and privacy/consent controls.
- **Out of Scope:** 3D avatars, Blender/GLB/GLTF meshes, Three.js rendering, bottom-wear/full-body outfits, and physical tailoring or size-fit guarantees.

---

## 2. Model Research & Selection Summary

During Phase 2 (`docs/model-evaluation/`), candidate 2D virtual try-on diffusion architectures—**IDM-VTON** and **CatVTON**—were evaluated against consumer hardware constraints (NVIDIA RTX 4050 6GB VRAM and Google Colab T4 16GB VRAM):
- **IDM-VTON** was selected as the primary target architecture via a clean `VirtualTryOnModel` adapter abstraction (`apps/api/app/ai/adapter.py`), supporting local CUDA inference, remote Colab/HF Space GPU HTTP execution (`MODEL_NAME=remote`), and a deterministic `StubTryOnModel` for automated CI/unit testing without GPU hardware.
- Detailed evaluation notes, hardware trade-offs, failure modes, and open-source license audits are documented in `docs/model-evaluation/model_selection_memo.md`, `docs/model-evaluation/hardware_and_benchmark.md`, and `docs/model-evaluation/license_and_compliance.md`.

---

## 3. System Architecture & Database Design

Detailed Mermaid diagrams for system architecture, Entity-Relationship modeling, and Data Flow (Level 1) are provided in `docs/diagrams/architecture_and_er.md`.

### 3.1 Core Architectural Layers
1. **Presentation Layer (`apps/web`):** React 18, TypeScript, Vite, Tailwind CSS, React Router v6, TanStack Query, and Axios. Key views include Landing, Catalog, Product Detail, Try-On Studio (consent modal, `ImageUploader`, `GuidanceCard`, `JobProgressView`, `ComparisonSlider`), History/Collections, Auth, Privacy Policy, and Admin Dashboard.
2. **API Layer (`apps/api`):** FastAPI with standardized `{code, message, request_id}` error responses, JWT authentication, Bcrypt password hashing, role-based access guards (`user` vs `admin`), Pillow binary image validation, and signed private media URLs.
3. **Persistence & Queue Layer:** PostgreSQL 16 via async SQLAlchemy 2.0 + Alembic migrations across 7 tables (`users`, `products`, `tryon_jobs`, `saved_looks`, `wishlist_items`, `consent_records`, `admin_audit_logs`), paired with Redis 7 for job dispatch, upload rate limiting, and JWT logout blocklisting.
4. **AI Worker Layer (`app.workers.tryon_worker`):** Standalone async worker process polling Redis/DB for `queued` jobs, executing `TryOnPipelineService` with bounded retries on recoverable failures, and persisting private PNG outputs.

---

## 4. Security & Privacy Engineering

- **Mandatory Consent Gate:** Try-on job submission and media upload require an active `consent_records` entry (`PRIVACY_CONSENT`).
- **Private Media & Signed URLs:** User uploads and generated outputs are never served from public static directories; access requires HMAC-signed URLs with expiration (`sig=`, `exp=`) and ownership checks against IDOR attacks.
- **Log Redaction & Production Secret Guard:** `redact_sensitive_text` strips `sig=`, `token=`, and `password=` from logs; `app/main.py` lifespan blocks startup if `ENVIRONMENT=production` uses the default `AUTH_SECRET_KEY`.
- **Security Headers & Rate Limiting:** Middleware sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy`; upload/try-on endpoints enforce per-user rate limits (`429 Too Many Requests`).

---

## 5. Verification, Testing & Performance Results

All automated checks were executed in Phase 13 (`docs/reports/test_report.md`):

- **Backend Automated Suite (`pytest -v -s`):** **`46 passed, 1 warning in 20.20s`** across health, models, auth, catalog, storage/uploads, model adapter, AI pipeline, jobs/worker, admin/collections, security/privacy, E2E user journey, and performance benchmarks (using in-memory SQLite, `LocalStorageBackend`, and `StubTryOnModel` on the local Windows test host).
- **Measured Local Latency (`tests/test_performance.py`):**
  - `GET /health` (10 runs): `p50 = 2.12ms`
  - `GET /api/v1/products` (10 runs): `p50 = 5.51ms`
  - `TryOnPipelineService` (`StubTryOnModel`, `768x1024`, 3 runs): `avg = 107.07ms` (`[166.2, 73.9, 81.1]`)
- **Frontend Tests & Build (`apps/web`):**
  - `vitest run` (`src/test/AppComponents.test.tsx`): **`5 passed (5)`** in `4.65s` (tests `167ms`).
  - `tsc --noEmit` & `vite build`: passed cleanly (`1708 modules transformed`, built in `4.41s`).

---

## 6. Deployment & DevOps

Containerized and cloud deployment artifacts are located in:
- `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`, and `docker-compose.prod.yml`
- `infra/deploy/render.yaml` (Render Blueprint) and `apps/web/vercel.json` (Vercel SPA config)
- `.github/workflows/ci.yml` (GitHub Actions CI for backend Pytest and frontend Vitest/TypeScript/Vite build)
- `docs/deployment/DEPLOYMENT_GUIDE.md`

---

## 7. Conclusion & Future Work

VestiAI successfully demonstrates a clean, modular, privacy-conscious architecture for 2D virtual clothing try-on in fashion e-commerce. By separating HTTP request handling from GPU inference via Redis-backed workers and abstracting both storage and AI model backends, the system runs deterministically in local development/CI while scaling cleanly to cloud object storage and remote GPU workers.

**Future Enhancements:**
- Support for additional garment categories (outerwear, dresses) with category-specific segmentation masks.
- Real-time WebSocket/SSE push notifications to replace polling on `JobProgressView`.
- Multi-garment outfit layering and automated garment background removal during admin catalog ingestion.

---

## 8. Bibliography & References

1. Choi, Y., et al. (2024). *Improving Diffusion Models for Authentic Virtual Try-on in the Wild (IDM-VTON)*. arXiv:2403.05139.
2. Chong, Z., et al. (2024). *CatVTON: Concatenation Is All You Need for Virtual Try-On with Diffusion Models*. arXiv:2407.15886.
3. FastAPI Documentation — https://fastapi.tiangolo.com/
4. SQLAlchemy 2.0 Async ORM Documentation — https://docs.sqlalchemy.org/
5. React 18 & Vite Documentation — https://react.dev/ & https://vitejs.dev/
6. Alembic Database Migrations — https://alembic.sqlalchemy.org/
