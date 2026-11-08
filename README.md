# VestiAI — AI-Powered Virtual Clothing Try-On for E-Commerce

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend: React + Vite + TS](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite-blue)](apps/web)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](apps/api)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791.svg)](docker-compose.yml)
[![AI: 2D Virtual Try-On](https://img.shields.io/badge/AI-2D%20Image%20Try--On-orange.svg)](docs/architecture/scope.md)

---

## 1. Project Introduction

**VestiAI** is an AI-powered 2D virtual clothing try-on platform tailored for modern fashion e-commerce. Online fashion shoppers frequently struggle to visualize how garments depicted in flat product photos or mannequin displays will appear when worn on their own body. VestiAI bridges this gap by enabling users to upload a front-facing photograph of themselves, select upper-body apparel from an interactive catalog (starting with T-shirts, shirts, sweatshirts, and blouses), and generate a realistic visual preview using state-of-the-art 2D diffusion technology.

> **Academic & Scope Notice:**  
> VestiAI is engineered as an honest, photorealistic 2D image-to-image visual preview system.  
> **Explicit Exclusions:** 3D avatars, 3D clothing meshes, Blender workflows, GLB/GLTF assets, Three.js, physical cloth simulation, and tailoring/size guarantee claims are **strictly out of scope** for this release.

---

## 2. Key Features

- **Fashion-Tech Catalog Experience:** Responsive catalog browsing with categories (Tops: T-shirts, shirts, sweatshirts, blouses), instant keyword search, and filters.
- **Consent-First Upload Flow:** Secure upper-body photo uploader with client-side guidance, instant client-side preview, file validation, and mandatory image processing consent.
- **Asynchronous AI Processing:** Non-blocking job submission (`queued` → `processing` → `completed` / `failed`) powered by an asynchronous background task queue.
- **Interactive Before / After Comparison:** Split slider allowing shoppers to inspect garment transfer, drape, and blending directly against their original photograph.
- **User History & Saved Looks:** Private saved results, history, and wishlist management with full user data deletion rights.
- **Catalog Administration:** Protected administrative workspace for catalog updates and background job monitoring.

---

## 3. System Architecture

```text
+-------------------------------------------------------------------------+
|                               SHOPPER                                   |
|                React 18 + TypeScript + Tailwind CSS                     |
+------------------------------------+------------------------------------+
                                     |  REST API / Multipart Upload
                                     v
+------------------------------------+------------------------------------+
|                             BACKEND API                                 |
|                   FastAPI + Pydantic + SQLAlchemy 2.0                   |
+-------------------+-----------------+-------------------+---------------+
                    |                 |                   |
                    v                 v                   v
            +---------------+ +---------------+   +---------------+
            |  PostgreSQL   | |  Redis Queue  |   | Private Media |
            |  Users, Jobs, | | Job Dispatch  |   | Local/S3 Store|
            |  Products     | +-------+-------+   +---------------+
            +---------------+         |
                                      v
                              +-------+-------+
                              |   AI WORKER   |
                              | PyTorch Model |
                              | (IDM-VTON)    |
                              +---------------+
```

---

## 4. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, TanStack Query, Axios |
| **Backend API** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 (async), Alembic, Uvicorn |
| **Database** | PostgreSQL 16 (via Docker Compose or managed instance) |
| **Queue / Cache** | Redis 7 |
| **Storage** | Pluggable storage abstraction (Local directory for dev; S3-compatible for prod) |
| **AI Inference** | PyTorch, IDM-VTON / CatVTON, Pillow, OpenCV (CUDA 12/13 / RTX 4050 / Google Colab) |

---

## 5. Prerequisites

Before running the application locally, ensure you have:
1. **Node.js** (v18+ or v20+, v24 supported) and **npm**
2. **Python** (v3.11 or v3.12 recommended; 64-bit)
3. **Docker & Docker Compose** (for PostgreSQL & Redis)
4. **Git**
5. *(Optional for local AI)* NVIDIA GPU with CUDA support (e.g., RTX 4050 6GB) or Google Colab

---

## 6. Installation & Environment Setup

### 6.1 Clone & Setup Environment File
```bash
git clone https://github.com/your-username/vestiai.git
cd vestiai

# Copy environment variables template
cp .env.example .env
```

### 6.2 Start Database & Redis (Docker)
```bash
docker-compose up -d
```
This spins up:
- **PostgreSQL**: `localhost:5432` (`vestiai_db`, user: `vestiai_user`, password: `vestiai_password`)
- **Redis**: `localhost:6379`

### 6.3 Backend Setup (FastAPI)
```bash
# Navigate to backend
cd apps/api

# Create & activate virtual environment (Windows PowerShell)
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run backend test suite
pytest

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 6.4 Frontend Setup (React + Vite)
```bash
# In a new terminal, navigate to frontend
cd apps/web

# Install packages
npm install

# Build check
npm run build

# Start development server
npm run dev
```
- Frontend application: [http://localhost:5173](http://localhost:5173)

---

## 7. Testing

### Run Backend Tests
```bash
cd apps/api
.\venv\Scripts\pytest
```

### Run Frontend Type Check & Build
```bash
cd apps/web
npm run lint
npm run build
```

---

## 8. AI Model Feasibility & Setup

VestiAI abstracts virtual try-on models behind a unified `VirtualTryOnModel` adapter interface (`apps/api/app/ai/adapter.py`).
- **Target Candidates:** IDM-VTON / CatVTON (2D diffusion-based image try-on).
- **Local Acceleration:** Verified for NVIDIA GPUs (RTX 4050 6GB with half-precision `fp16`).
- **Cloud Fallback:** Ready for Google Colab GPU notebooks or external serverless endpoints.
- **Test Stub:** Deterministic stub adapter enabled during unit testing for instant CI/CD validation.

---

## 9. Project Structure

```text
vestiai/
├── apps/
│   ├── web/                     # React + TypeScript Vite frontend
│   │   ├── src/
│   │   │   ├── components/      # UI components
│   │   │   ├── pages/           # Application views
│   │   │   ├── layouts/         # Layout shells & navigation
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── services/        # Typed API clients
│   │   │   ├── types/           # TypeScript interfaces
│   │   │   └── assets/          # Static assets & styles
│   │   ├── public/              # Public web assets
│   │   └── package.json
│   │
│   └── api/                     # FastAPI backend
│       ├── app/
│       │   ├── api/v1/routes/   # Versioned API routes
│       │   ├── core/            # Configuration & security
│       │   ├── db/              # Database engine & session
│       │   ├── models/          # SQLAlchemy ORM models
│       │   ├── schemas/         # Pydantic schemas
│       │   ├── services/        # Business logic & storage
│       │   ├── repositories/    # Data access layer
│       │   ├── workers/         # Background queue workers
│       │   ├── ai/              # Virtual try-on adapters
│       │   └── main.py          # FastAPI application entry
│       ├── alembic/             # Database migrations
│       ├── tests/               # Backend test suite
│       └── requirements.txt
│
├── docs/                        # Architecture, reports & model cards
│   ├── architecture/            # Scope & architectural decisions
│   ├── diagrams/                # Flowcharts & diagrams
│   ├── reports/                 # Academic progress reports
│   ├── TASK_TRACKER.md          # 17-phase implementation tracker
│   └── MILESTONES.md            # Milestones and acceptance criteria
│
├── storage_data/                # Local development media store
├── infra/                       # Infrastructure & deployment manifests
├── scripts/                     # Helper & seeding scripts
├── docker-compose.yml           # Local PostgreSQL & Redis
├── .env.example                 # Environment variable templates
├── .gitignore                   # Security & artifact exclusions
├── LICENSE                      # MIT License
└── README.md                    # Project documentation
```

---

## 10. Responsible AI & Privacy Commitments

1. **Explicit Consent:** Shoppers must confirm consent before any personal photograph is processed.
2. **Private Storage:** Personal photos and generated outputs are private and not indexed or publicly served.
3. **Data Deletion:** Shoppers retain full control to delete their try-on jobs and uploaded assets immediately.
4. **Honest Output Notice:** Every generated image includes a clear advisory note stating that the visualization is an AI estimate and does not constitute a guaranteed physical fit.

---

## 11. Authors & License

- **Project:** VestiAI (College Mini-Project)
- **License:** [MIT License](LICENSE)

