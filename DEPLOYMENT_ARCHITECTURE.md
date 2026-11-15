# VestiAI 2.0 — Production Deployment Architecture

```mermaid
flowchart TD
    subgraph Client Tier ["Client Applications"]
        Web["VestiAI Web (React + Vite + Tailwind)\nHosted on Vercel"]
        Ext["VestiAI Chrome Extension\nManifest V3"]
    end

    subgraph CDN_Edge ["Edge & Storage Tier"]
        CF_R2["Cloudflare R2 Private Bucket\n('vestiai-media')"]
        Presigned["Direct Presigned Upload\nPUT /vestiai-media/{key}"]
    end

    subgraph API_Tier ["Backend Application Tier (Render)"]
        FastAPI["FastAPI Web Server\n(JWT Auth, REST APIs, Catalog, Cart, Orders)"]
        Worker["Redis / RQ Background Worker\n(Job Polling & Pipeline Dispatch)"]
        Redis["Redis (Key-Value & Job Queue)"]
    end

    subgraph Database_Tier ["Database Tier (Render / Supabase)"]
        Postgres[(PostgreSQL 16\nUsers, Products, Categories, Cart,\nOrders, TryOnJobs, UserImages)]
    end

    subgraph AI_Tier ["Serverless GPU Inference Tier"]
        Modal["Modal Serverless GPU Container\n(NVIDIA A10G / L4)\nIDM-VTON / CatVTON Model"]
        RunPod["RunPod Serverless Worker\n(Fallback GPU Endpoint)"]
    end

    %% Client flows
    Web -->|HTTPS / REST API| FastAPI
    Ext -->|HTTPS / REST API| FastAPI
    Web -.->|Direct Presigned PUT| Presigned
    Presigned --> CF_R2

    %% Backend flows
    FastAPI <-->|SQLAlchemy ORM| Postgres
    FastAPI -->|Enqueues Try-On Job| Redis
    Redis -->|Dequeues Job| Worker
    Worker <-->|Reads & Updates Status| Postgres
    Worker -->|Signed GET Image URL| CF_R2
    Worker -->|POST /infer (Auth Key)| Modal
    Modal -.->|Fallback Failover| RunPod
    Modal -->|Returns Base64 / URL Result| Worker
    Worker -->|Uploads Final Image| CF_R2
```

---

## 1. Architecture Components

### 1.1 Web Frontend (Vercel)
- **Framework:** React 18, Vite 5, TypeScript, Tailwind CSS, TanStack Query / Axios.
- **Routing:** React Router v6.
- **Features:** Responsive catalog, product detail page, cart drawer, test checkout flow, interactive virtual try-on studio with drag-and-drop & live camera stream, user order history, and role-based admin console.
- **Deployment:** Vercel edge network with continuous deployment on git `push` to `master`.

### 1.2 Backend API (Render)
- **Framework:** FastAPI with Python 3.12, Pydantic v2, SQLAlchemy 2.0, Alembic.
- **Security:** Bcrypt password hashing (12 rounds), JWT access tokens (HMAC-SHA256), HMAC-signed media delivery tokens, CORS whitelisting, and role-based permissions (`admin`, `customer`).
- **Endpoints:** Authentication, User Profiles, Catalog & Search, Cart CRUD, Orders & Checkout, Media Uploads (Presigned URLs), Virtual Try-On Jobs, Collections, and Administrative Control & Audit Logging.

### 1.3 Database (PostgreSQL on Render / Supabase)
- **Entities:** `User`, `Category`, `Product`, `UserImage`, `Cart`, `CartItem`, `Order`, `OrderItem`, `TryOnJob`, `WishlistItem`, `SavedLook`, `AdminAuditLog`, `ConsentRecord`.
- **Integrity:** Enforced foreign keys, cascades on user deletion, indices on search columns (`category_id`, `status`, `user_id`, `created_at`).

### 1.4 Object Storage (Cloudflare R2)
- **Bucket:** `vestiai-media` (Private bucket).
- **Upload Protocol:** S3-compatible presigned `PUT` URLs generated server-side by FastAPI. The frontend uploads large user photos and garment images directly to R2, avoiding API server memory bottlenecks.
- **Download Security:** Private read access via HMAC-SHA256 signed URLs or short-lived presigned GET URLs generated on demand.

### 1.5 Dedicated GPU Serverless Inference (Modal & RunPod)
- **Engine:** PyTorch with CUDA acceleration (NVIDIA A10G / L4 / A100).
- **Architecture:** Serverless cold-start mitigation with container warm-up, FP16 precision, and memory clearing via `torch.cuda.empty_cache()`.
- **Endpoints:**
  - `GET /health`: Liveness and GPU memory status.
  - `GET /model-info`: Current model weights and hardware specs.
  - `POST /infer`: High-throughput image-to-image virtual try-on inference.
