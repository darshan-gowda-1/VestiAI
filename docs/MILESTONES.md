# VestiAI Project Milestones & Acceptance Gates

This document defines the milestone schedule, deliverables, and strict acceptance criteria for each phase of the VestiAI college mini-project.

---

### Milestone 1: Project Setup & Environment Baseline (Week 1)
- **Deliverables:** Monorepo directory structure, `.gitignore`, `.env.example`, `LICENSE`, `docker-compose.yml`, task tracker, baseline scope document, working frontend build, working backend health check.
- **Acceptance Gate:** 
  1. Frontend build completes with zero errors (`npm run build`).
  2. Backend starts and serves `/health` responding with HTTP 200.
  3. No secrets or model weights tracked in Git.

### Milestone 2: AI Model Feasibility Spike (Week 2)
- **Deliverables:** Evaluation of IDM-VTON / CatVTON, hardware evaluation on RTX 4050 6GB and Google Colab, test dataset pairs, documented licenses, initial real inference sample output, model adapter interface definition.
- **Acceptance Gate:** 
  1. At least one real inference run confirmed on target hardware.
  2. GPU VRAM consumption, execution time, and output resolution documented honestly.
  3. Clean adapter interface contract implemented.

### Milestone 3: UI/UX Design System & Layouts (Week 3)
- **Deliverables:** Design tokens, responsive wireframes/layouts for landing, catalog, product detail, try-on workspace, processing state, before/after result screen, user history, auth, and admin views.
- **Acceptance Gate:** 
  1. Accessible color contrast ratios verified.
  2. Complete mobile, tablet, and desktop layouts defined.
  3. Clear disclaimer states designed (no guaranteed fit claims).

### Milestone 4: Frontend Application Foundation (Week 4)
- **Deliverables:** Complete React/TypeScript UI implementation using Tailwind CSS, React Router, reusable components, upload component with instant preview, image guidance cards, before/after split slider, and mock data views.
- **Acceptance Gate:** 
  1. All user screens accessible and responsive.
  2. Client-side upload validation (MIME, size, aspect ratio) functioning.
  3. Frontend compiles cleanly with strict TypeScript checks.

### Milestone 5: Backend API & Database Foundation (Week 5)
- **Deliverables:** FastAPI backend core, SQLAlchemy 2.0 ORM models, Alembic migration environment, PostgreSQL configuration, standard error handling middleware, Pydantic schemas, and Swagger API docs.
- **Acceptance Gate:** 
  1. Database tables created via Alembic migrations.
  2. `/health` checks verify database connection pool status.
  3. Standardized error format `{code, message, request_id}` active across all endpoints.

### Milestone 6: Authentication & User Management (Week 6)
- **Deliverables:** JWT authentication flow, password hashing with Bcrypt, role guards (User vs. Admin), registration, login, logout, and user profile management.
- **Acceptance Gate:** 
  1. Unauthenticated requests to protected endpoints return 401 Unauthorized.
  2. Non-admin users forbidden from administrative endpoints (403 Forbidden).
  3. Passwords securely hashed; zero plaintext leakage.

### Milestone 7: Product Catalog & Media Storage Service (Week 7)
- **Deliverables:** Product catalog CRUD APIs with pagination/filtering, sample catalog seed data (12+ tops), local and S3-compatible storage abstraction, server-side image validation (Pillow decode), signed URL generator.
- **Acceptance Gate:** 
  1. Products queryable by category and search keyword.
  2. Uploaded images verified with real binary decode (rejects disguised executables).
  3. Private storage verified; direct unauthenticated media access blocked.

### Milestone 8: AI Model Pipeline Integration (Week 8)
- **Deliverables:** Model adapter implementation, preprocessing (pose alignment, background cleanup, garment isolation), postprocessing, error handlers for GPU OOM and timeouts.
- **Acceptance Gate:** 
  1. Automated fallback to deterministic test stub during unit testing.
  2. Real adapter successfully processes test pair on GPU.
  3. Proper error code returned on corrupt or unsupported image.

### Milestone 9: Asynchronous Background Job Processing (Week 9)
- **Deliverables:** Redis queue integration with Celery/RQ worker, job lifecycle management (`queued` -> `processing` -> `completed` / `failed`), progress polling endpoints.
- **Acceptance Gate:** 
  1. Heavy inference decoupled from HTTP request thread.
  2. Job status transitions persist accurately in PostgreSQL.
  3. Worker crashes or timeouts handled gracefully with failure status.

### Milestone 10: Full End-to-End System Integration (Week 10)
- **Deliverables:** Frontend hooked up to real FastAPI endpoints via typed API client; complete user flow from garment selection to AI try-on result display.
- **Acceptance Gate:** 
  1. User can register, pick a top, upload a selfie, submit a try-on job, poll status, and view the AI result.
  2. Before/after comparison renders the actual generated image.

### Milestone 11: History, Wishlist & Administration (Week 11)
- **Deliverables:** Personal try-on history page, saved looks management, wishlist toggle, admin product management dashboard, job monitoring.
- **Acceptance Gate:** 
  1. Users can delete their own try-on jobs (removing DB record and stored files).
  2. Admin can add, update, and deactivate catalog products.

### Milestone 12: Security, Privacy & Compliance (Week 11)
- **Deliverables:** Explicit consent check prior to upload, media retention policy, CORS verification, upload rate limiting, audit logging.
- **Acceptance Gate:** 
  1. Jobs cannot be submitted without active consent record.
  2. Cross-user access (IDOR) attacks rejected.
  3. Zero user image bytes exposed in server logs.

### Milestone 13: QA, Automated Testing & Evaluation (Week 12)
- **Deliverables:** Pytest unit and integration test suite, frontend component tests, quantitative latency and qualitative fidelity evaluation report.
- **Acceptance Gate:** 
  1. Automated test suite passes.
  2. Evaluation matrix completed with real test pairs.

### Milestone 14: Deployment (Week 12)
- **Deliverables:** Production Docker containers, deployment configuration, environment checklist, live demonstration instance.
- **Acceptance Gate:** 
  1. Application accessible on public network or verifiable local container cluster.
  2. Production health checks pass.

### Milestone 15 & 16: College Academic Report & Final Delivery (Week 12)
- **Deliverables:** Final project report PDF, presentation slide deck, demonstration walkthrough video/script, clean GitHub repository release.
- **Acceptance Gate:** 
  1. Complete project report with architecture, ER diagrams, data flow diagrams, and bibliography.
  2. Clean repository clone test successful from scratch.

