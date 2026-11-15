# VestiAI 2.0 — Implementation Roadmap

This roadmap outlines the systematic 16-phase completion plan for VestiAI 2.0.

---

## Progress Overview

- [x] **Phase 1: Project Repository Audit**
  - Complete filesystem, git branch, architecture, and dependency audit.
  - Deliverable: `PROJECT_AUDIT.md`.
- [x] **Phase 2: Master Architecture & Environment Specs**
  - Deliverables: `DEPLOYMENT_ARCHITECTURE.md`, `ENVIRONMENT_VARIABLES.md`, `IMPLEMENTATION_ROADMAP.md`.
- [ ] **Phase 3: Database Entities & Schema Upgrades**
  - Implement `Category`, `UserImage`, `Cart`, `CartItem`, `Order`, `OrderItem` models.
  - Upgrade `Product` with `available_sizes`, `inventory`, `discount_price`, `category_id`.
  - Update `TryOnJob` status states (`pending`, `queued`, `processing`, `completed`, `failed`, `cancelled`).
  - Export all models in `apps/api/app/models/__init__.py`.
- [ ] **Phase 4: Backend API Expansion**
  - Implement `/api/v1/uploads` (presigned S3/R2 direct upload flow).
  - Implement `/api/v1/cart` (Cart CRUD, size options, quantities).
  - Implement `/api/v1/orders` (Test checkout, status management, user order history).
  - Implement `/api/v1/categories` (Public listing and administrative management).
  - Register new routers in `apps/api/app/main.py`.
- [ ] **Phase 5: Dedicated GPU Serverless AI Specification**
  - Create `infra/ai/modal_tryon.py` with GPU model warm-up, batch inference, memory management, and health endpoints.
  - Create `infra/ai/runpod_handler.py` for RunPod serverless worker.
  - Maintain clean adapter abstraction in `apps/api/app/ai/adapter.py`.
- [ ] **Phase 6: Frontend E-Commerce & Virtual Try-On Studio**
  - Global Cart state management (`CartContext.tsx` & `useCart`).
  - Cart Page (`/cart`) & Cart Drawer with size selector, item count, and subtotal.
  - Test Checkout modal with order creation and confirmation.
  - Navbar upgrades: Cart counter pill, Categories quick-link, My Try-Ons.
  - Product Detail Page upgrades: Size selector, stock status, direct "Try This On" and "Add to Cart" actions.
  - User Dashboard: Orders tab and Uploaded Photos gallery.
- [ ] **Phase 7: Comprehensive Verification & Automated Testing**
  - Run all Pytest test cases in `apps/api/tests/` (including new cart, orders, uploads, and category tests).
  - Run all Vitest frontend test cases in `apps/web/` (`npm.cmd test`).
  - Run frontend lint and build (`npm.cmd run lint`, `npm.cmd run build`).
  - Run Chrome extension tests and build (`apps/extension`).
- [ ] **Phase 8: Git Commit & Remote Synchronization**
  - Stage all files, commit with semantic message, and push to GitHub `origin/master`.
  - Final verification of repo integrity.
