# VestiAI — Project Scope & System Specification

## 1. Project Objective
VestiAI is an AI-powered 2D virtual clothing try-on web application designed for fashion e-commerce. Its primary objective is to allow shoppers to upload a photograph of themselves, select a catalog garment (starting with tops), and obtain an AI-generated photorealistic visualization of how the chosen garment looks on them. 

VestiAI serves as a visual aid to assist shopping decisions. It does not claim or provide certified garment fit, exact tailoring measurements, or physical fabric simulation.

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

