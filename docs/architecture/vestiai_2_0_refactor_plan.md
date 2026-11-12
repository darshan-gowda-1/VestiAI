# VestiAI 2.0 — Phase 1 Audit & Refactor Plan

**Decision:** **Refactor and upgrade the existing VestiAI repository in-place** (do NOT rewrite from scratch).  
Roughly 70% of the production infrastructure—FastAPI backend, 7-table PostgreSQL schema, Alembic migrations, JWT/Bcrypt auth, Redis queue, S3/R2 & local storage with HMAC-signed URLs, `VirtualTryOnModel` adapter (`IDM-VTON` / `CatVTON` / `RemoteGPU` / `StubTryOnModel`), privacy/consent controls, and CI/CD—is already implemented, verified (46 backend tests + 5 frontend tests), and reusable.

---

## 1. Existing Feature Inventory (`TASK-01`, `TASK-02`, `TASK-05`)

| Area | Current State (VestiAI 1.0) | VestiAI 2.0 Action |
| :--- | :--- | :--- |
| **Backend API (`apps/api`)** | Working FastAPI app with `/auth`, `/users`, `/products`, `/tryon`, `/collections`, `/media`, `/admin`, `/health`. | **Reuse & Extend:** Add `currency`, `retailer_url`, `source` to `Product`; add `/products/search`, `/categories`, `/history`, `/tryon/jobs/{id}/retry`, and `/extension/*` endpoints. |
| **Database (`apps/api/app/models`)** | Working 7-table async SQLAlchemy 2.0 schema + Alembic. | **Reuse & Migrate:** Add Alembic migration for new `Product` retailer/source columns and extension session support. |
| **AI Pipeline (`apps/api/app/ai`)** | Working `VirtualTryOnModel` adapter + `TryOnPipelineService` + `StubTryOnModel`. | **Preserve:** Keep existing 2D image-based AI model as the reliable engine for Mode 2 (AI Virtual Try-On). |
| **Storage & Security** | Working private storage, signed URLs, EXIF strip, consent gate, rate limiting, secret guard. | **Reuse:** Extend privacy/URL validation to cover camera stream cleanup and external retailer URLs. |
| **Frontend (`apps/web`)** | Working React 18 + Vite + Tailwind app with `/catalog`, `/tryon`, `/result/:jobId`, `/history`, `/wishlist`, `/admin`. | **Upgrade:** Redesign landing page & `/try-on` around live `MediaDevices` camera + drag-and-drop garment selection + upload fallback; expand `/store` & `/product/:id` with price filters & retailer links; add missing routes (`/how-it-works`, `/terms`, `/forgot-password`, `/saved-looks`, `/try-on/result/:jobId`, `/admin/products`, `/admin/jobs`). |
| **Chrome Extension (`apps/extension`)** | Not yet created. | **New App (Phase 10):** Build Manifest V3 TypeScript/React extension after main website + AI flow is complete. |
| **Real-Time Video AI** | Not yet researched/prototyped. | **Isolated Research (Phase 12):** Benchmark temporal stability, FPS, VRAM, and licensing without faking live AI over webcam. |

---

## 2. Reference Functional Analysis (`TASK-03`)

Inspired functionally (never copying code, branding, or proprietary assets) by `anywear.decart.ai`, `shopanywear.com`, and the Anywear Chrome Extension:
1. **Live Camera + Drag-and-Drop Centerpiece (`/try-on`):**
   - Desktop 3-column layout: Left garment sidebar (search, category tabs, draggable thumbnails) -> Center large webcam preview + drop zone + capture/upload controls -> Right selected garment + "Try This Look" + status.
   - Mobile stacked layout: Camera top -> horizontal garment carousel -> prominent Try-On CTA -> result below.
2. **Two Honest Try-On Modes:**
   - **Mode 1 (Camera Experience):** Live browser `MediaDevices` webcam stream for framing, camera switching, and garment selection via drag-and-drop or tap.
   - **Mode 2 (AI Virtual Try-On):** Captures a frame (or uses uploaded photo) + selected garment -> submits async job to existing 2D AI pipeline -> displays real generated result with before/after slider.
3. **Fashion Store (`/store`):** Searchable catalog, category & price filters, sorting, favorites, saved looks, and external retailer attribution links.
4. **Chrome Extension (`apps/extension`):** Manifest V3 popup/side-panel + content script to pick product images on supported shopping sites and launch VestiAI try-on.

---

## 3. Dependency & Environment Audit (`TASK-07`, `TASK-08`, `TASK-09`)

- **Frontend (`apps/web/package.json`):** Already has React 18, Vite 5, TypeScript, Tailwind CSS, React Router v6, TanStack Query, Axios, Lucide Icons, Vitest. Optional additions in Phase 2/9: `react-hook-form`, `zod`, `@hookform/resolvers` for form validation.
- **Backend (`apps/api/requirements.txt`):** FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Redis, Boto3, Pillow — all sufficient; no unnecessary dependencies needed.
- **Extension (`apps/extension`):** Will use TypeScript + Vite + `@types/chrome` + React when created in Phase 10.
- **Git Safety (`TASK-09`):** Verified `.gitignore` excludes `.env`, `venv/`, `node_modules/`, `storage_data/`, `dist/`, and `__pycache__/`.

