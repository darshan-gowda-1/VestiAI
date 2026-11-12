# VestiAI — AI-Powered 2D Virtual Clothing Try-On
## College Mini-Project Presentation Deck

---

### Slide 1: Title & Team
**VestiAI — AI-Powered 2D Virtual Clothing Try-On for E-Commerce**  
*Honest, Consent-First 2D Garment Visualization*  
Stack: React 18 · TypeScript · FastAPI · PostgreSQL 16 · Redis 7 · IDM-VTON / Remote GPU

---

### Slide 2: Problem Statement
- Online apparel shoppers cannot easily visualize how a top from a flat product photo will look on their own body.
- High return rates and buyer hesitation stem from visual uncertainty.
- **Goal:** Provide a fast, private, browser-based 2D try-on preview for upper-body tops (`t-shirt`, `shirt`, `sweatshirt`, `blouse`).

---

### Slide 3: Project Scope & Honest Boundaries
- **In Scope:**
  - 2D image-to-image garment transfer for upper-body tops.
  - Consent-first photo upload with guidance & binary image validation.
  - Asynchronous job queue (`queued` -> `processing` -> `completed` / `failed`).
  - Before/after split slider, saved looks, wishlist, and admin catalog CRUD.
- **Explicitly Out of Scope:**
  - No 3D avatars, Blender/GLB/Three.js meshes, or physical size/fit guarantees.

---

### Slide 4: System Architecture
- **Frontend:** React 18 + Vite + Tailwind CSS + TanStack Query + Axios.
- **Backend API:** FastAPI + Pydantic v2 + SQLAlchemy 2.0 Async + Alembic.
- **Data & Queue:** PostgreSQL 16 (7 tables) + Redis 7 (queue, rate limit, JWT blocklist).
- **Storage & AI:** Pluggable `StorageBackend` (Local / S3-R2) + `VirtualTryOnModel` adapter (`StubTryOnModel`, `IDM-VTON`, `RemoteGPU`).

---

### Slide 5: Database Schema (7 Core Tables)
- `users` · `products` · `tryon_jobs`
- `saved_looks` · `wishlist_items`
- `consent_records` · `admin_audit_logs`
- Full cascade/deletion support when users remove their own jobs or data.

---

### Slide 6: AI Pipeline & Model Selection
- Evaluated **IDM-VTON** and **CatVTON** for 6GB RTX 4050 & Google Colab T4.
- Implemented `TryOnPipelineService`:
  1. Image validation (Pillow decode, MIME, resolution checks)
  2. Preprocessing & garment isolation
  3. Pluggable model inference (`VirtualTryOnModel`)
  4. Private PNG persistence & signed URL generation

---

### Slide 7: Security & Privacy by Design
- Explicit `PRIVACY_CONSENT` required before upload/try-on.
- Private storage with time-limited HMAC signed URLs (no public media buckets).
- Cross-user IDOR protection, per-user upload rate limiting (`429`), security headers, and log redaction (`sig=`, `token=`, `password=`).
- Production startup guard rejects default `AUTH_SECRET_KEY`.

---

### Slide 8: Testing & Quality Assurance (Phase 13)
- **Backend Pytest:** `46 passed` across auth, catalog, storage, AI pipeline, worker, security/privacy, E2E journey, and performance benchmarks.
- **Local Latency Benchmarks:** `/health` p50 `2.12ms`, `/api/v1/products` p50 `5.51ms`, `StubTryOnModel` avg `107.07ms`.
- **Frontend Vitest + Build:** `5 passed` component/state tests (`ImageUploader`, `JobProgressView`, `ComparisonSlider`, `GuidanceCard`), `tsc --noEmit` & `vite build` passed.

---

### Slide 9: Deployment & CI/CD (Phase 14)
- Production Dockerfiles (`apps/api/Dockerfile`, `apps/web/Dockerfile` + Nginx proxy).
- `docker-compose.prod.yml` orchestrating Postgres, Redis, Alembic migrate, API, Worker, and Web.
- Cloud blueprints for **Vercel** (`vercel.json`) + **Render** (`render.yaml`) + **GitHub Actions** (`.github/workflows/ci.yml`).

---

### Slide 10: Live Demo Flow
1. Browse Tops Catalog & filter by category/keyword.
2. Register/Login & accept explicit image-processing consent.
3. Upload front-facing photo via `ImageUploader` (validated locally & on server).
4. Submit async Try-On Job -> observe `queued` -> `processing` -> `completed`.
5. Inspect before/after result with `ComparisonSlider` & save/delete look.

---

### Slide 11: Conclusion & Future Scope
- **Delivered:** End-to-end, tested, containerized, privacy-first 2D virtual try-on platform.
- **Future Scope:** Multi-category garments, WebSocket real-time job updates, automated garment segmentation on catalog upload.

