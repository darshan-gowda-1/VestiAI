# VestiAI — Project Scope & System Specification

## 1. Project Objective (VestiAI 2.0)
VestiAI is an AI-powered live virtual fashion try-on platform consisting of three connected products under the VestiAI brand:
1. **VestiAI Main Website (`/`, `/try-on`):** Live browser camera experience with drag-and-drop garment selection, photo upload fallback, frame capture, and asynchronous 2D AI try-on generation with before/after comparison.
2. **VestiAI Fashion Store (`/store`, `/product/:id`):** Searchable catalog with category/price filters, sorting, saved looks, wishlist, and external retailer attribution links.
3. **VestiAI Chrome Extension (`apps/extension`, MV3):** Browser extension enabling users to select product images on supported external shopping websites and launch VestiAI try-on.

### Two Try-On Modes & Honest Technical Boundaries
- **Mode 1 — Camera Experience:** Displays the user's live `MediaDevices` webcam stream for positioning and drag-and-drop garment selection. This is a live preview and does **not** claim continuous real-time AI video garment rendering.
- **Mode 2 — AI Virtual Try-On:** Captures a camera frame (or uses an uploaded photo) and executes the asynchronous 2D diffusion model (`IDM-VTON` / `CatVTON` / remote GPU worker) to produce a genuine AI result.
- **Real-Time Video AI:** Investigated separately in an isolated research phase; never faked by stretching static garment PNGs over a webcam feed.
- **Explicit Exclusions:** No 3D avatars, Blender/GLB/Three.js meshes, or certified tailoring/physical size-fit guarantees.

---

## 2. User Roles & Personas

1. **E-Commerce Shopper (End-User):**
   - Discovers and browses tops in the catalog (T-shirts, shirts, sweatshirts, blouses).
   - Views high-resolution product imagery, details, and colorways.
   - Consents to image processing and uploads an upper-body front-facing photograph.
   - Initiates an asynchronous try-on request and monitors real-time status.
   - Inspects generated try-on previews with interactive before/after visual comparisons.
   - Manages personal try-on history, wishlist, and saved looks.
   - Requests permanent deletion of personal photos and generated results at any time.

2. **Catalog Administrator:**
   - Manages the product catalog (create, edit, toggle active status, archive garments).
   - Uploads clean flat-lay garment imagery meeting AI input specifications.
   - Monitors background AI processing jobs, latency metrics, and error rates.
   - Reviews system audit logs without exposing private user photographs.

3. **Academic Evaluator / Reviewer:**
   - Evaluates system architecture, AI pipeline integration, and engineering quality.
   - Audits reproducible benchmarks, latency records, failure handling, and security controls.

---

## 3. Main Features & Capabilities

- **Catalog & Discovery:**
  - Fast, responsive product browsing with category filters, keyword search, and sorting.
  - Product detail views featuring standardized flat garment photography.
- **Image Upload & Preflight Validation:**
  - Client and server-side MIME type, dimension, aspect ratio, and corrupt-image validation.
  - Image guidance: clear prompts for front-facing pose, unobstructed torso, and good lighting.
  - Replacement and removal controls prior to submission.
- **Consent & Privacy Management:**
  - Explicit user consent required before image processing begins.
  - Private object storage with short-lived signed URLs; no public access to personal photos.
  - User-driven deletion removing both database records and physical image files.
- **Asynchronous AI Processing:**
  - Decoupled job lifecycle (`queued` -> `processing` -> `completed` / `failed`).
  - Redis-backed job queue with isolated AI worker process to prevent API blocking.
  - Transparent error reporting with stable error codes and friendly guidance.
- **Interactive Results & History:**
  - Interactive split/slider before-and-after comparison.
  - Downloadable generated results with clear AI-disclaimer watermarks/badges.
  - Personal try-on history and saved favorite looks.
- **Catalog Administration:**
  - Protected administrative endpoints and UI for managing inventory.

---

## 4. Initial Garment Categories

The initial release focuses exclusively on upper-body apparel (**Tops**):
- **T-shirts** (crew neck, v-neck, relaxed fit)
- **Shirts** (casual button-downs, formal shirts)
- **Sweatshirts & Hoodies** (pullover, crewneck)
- **Blouses** (formal, casual)

The modular pipeline and database schema are built to allow future category expansion (dresses, bottoms, outerwear) without altering the core architecture.

---

## 5. Non-Functional Requirements

- **Performance & Latency:**
  - Web UI: Sub-1.5s initial load time on desktop and mobile broadband.
  - API Response: Sub-150ms latency for metadata and catalog endpoints.
  - AI Inference: Measured and bounded job execution time with explicit client polling.
- **Security & Privacy:**
  - Secure credential hashing using Bcrypt.
  - JWT token authorization with role-based access control (User vs. Admin).
  - Private media storage: uploads and outputs accessible only via verified owner tokens or signed URLs.
  - Strict zero-traceback exposure in production API errors (`{code, message, request_id}`).
- **Reliability & Error Handling:**
  - Graceful handling of GPU out-of-memory (OOM), queue timeouts, and invalid input images.
  - Worker failure recovery without orphaned jobs.
- **Design & Accessibility:**
  - Warm, minimal, luxury fashion-tech design language (warm off-white canvas, charcoal typography).
  - Fully responsive across desktop, tablet, and mobile screens.
  - Keyboard navigation, visible focus indicators, and semantic HTML.

---

## 6. Explicit Exclusions (Strict Scope Restrictions)

To maintain technical honesty and academic rigor, the following are **strictly out of scope** for this release:
- ❌ **3D Avatars or 3D Model Generation** (No MakeHuman, SMPL, or 3D meshes).
- ❌ **3D Garment Models & Assets** (No GLB/GLTF 3D garment files).
- ❌ **3D Simulation Workflows** (No Blender, Marvelous Designer, or cloth simulation engines).
- ❌ **WebGL / Three.js 3D Viewers** (The application is strictly 2D image-to-image).
- ❌ **Physical Size or Exact Fit Guarantees** (No claims that the visual output represents tailored fit).
- ❌ **Live Payment Gateways & E-Commerce Checkout** (Catalog uses demo prices; checkout is excluded).
- ❌ **Synthetic/Fabricated AI Results** (No fake pre-rendered static images disguised as dynamic AI outputs).

---

## 7. Future Scope (Post-MVP)

- Multi-category try-on (full outfits: pairing tops with pants, skirts, and jackets).
- Automated body measurement estimation from calibrated dual-camera images.
- Integration with external merchant APIs (Shopify, WooCommerce, Magento).
- High-definition garment texture zoom and fabric drape fine-tuning.
- Advanced pose-invariant diffusion models and continuous fine-tuning on merchant catalogs.

