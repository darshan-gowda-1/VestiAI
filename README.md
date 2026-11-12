# VestiAI 2.0 — AI-Powered Live Virtual Fashion Try-On Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend: React + Vite + TS](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite-blue)](apps/web)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](apps/api)
[![Extension: Chrome MV3](https://img.shields.io/badge/Extension-Chrome%20Manifest%20V3-yellow.svg)](apps/extension)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791.svg)](docker-compose.yml)

---

## 1. Project Introduction (VestiAI 2.0)

**VestiAI 2.0** is an interactive, consent-first virtual fashion try-on platform combining three connected components under the VestiAI brand:

1. **VestiAI Live Try-On Website (`apps/web`, `/try-on`):** Live browser webcam experience (`MediaDevices`) with front/rear camera switching, drag-and-drop garment selection, photo upload fallback, frame capture, and asynchronous 2D AI try-on with before/after comparison.
2. **VestiAI Fashion Store (`apps/web`, `/store`, `/product/:id`):** Searchable upper-body catalog (`t-shirt`, `shirt`, `sweatshirt`, `blouse`) with category & price filters, sorting, wishlist, saved looks, and external retailer attribution links.
3. **VestiAI Chrome Extension (`apps/extension`, Manifest V3):** Minimal-permission popup + side-panel extension allowing users to pick garment images on supported shopping sites and launch VestiAI 2D try-on.

> **Honest Two-Mode Architecture & Scope Notice:**  
> - **Mode 1 — Camera Experience:** Live browser webcam framing + drag-and-drop garment selection (does **not** claim continuous real-time AI video rendering).  
> - **Mode 2 — AI Virtual Try-On:** Captures a frame (or uses an uploaded photo) and runs the asynchronous 2D diffusion model (`IDM-VTON` / `CatVTON` / remote Colab GPU / deterministic test stub).  
> - **Explicit Exclusions:** 3D avatars, Blender/GLB/Three.js meshes, and certified physical sizing guarantees are **out of scope**. Real-time video try-on feasibility is documented separately in [REALTIME_TRYON_RESEARCH.md](docs/ai/REALTIME_TRYON_RESEARCH.md).

---

## 2. Key Features

- **Live Camera + Drag-and-Drop Workspace (`/try-on`):** 3-column desktop / mobile-carousel layout with explicit user-initiated camera permission, automatic stream cleanup, drag-and-drop garment selection, and click-to-select fallback.
- **VestiAI Fashion Store (`/store`):** Category tabs, keyword search, price range filters, sorting, wishlist, and safe external retailer links.
- **Interactive Result Experience (`/try-on/result/:jobId`):** Draggable before/after comparison slider, Save Look, Download Result, Retake Photo, View Product, model version metadata, and failed-job retry.
- **Chrome Extension (`apps/extension`):** On-demand `activeTab` + `scripting` product image extractor, CORS-aware handling, side-panel consent & try-on submission, and saved looks integration.
- **Privacy & Security by Design:** Mandatory image-processing consent, private storage with HMAC-signed URLs, EXIF stripping, rate limiting, and full user data deletion.

### Additional Documentation
- [Deployment & Operations Guide](docs/deployment/DEPLOYMENT_GUIDE.md)
- [Chrome Extension Install & Privacy Guide](docs/extension/EXTENSION_GUIDE.md)
- [Architecture, ER & Data Flow Diagrams](docs/diagrams/architecture_and_er.md)
- [Real-Time Try-On Research Memo](docs/ai/REALTIME_TRYON_RESEARCH.md)
- [Final Academic Project Report](docs/reports/VestiAI_Final_Project_Report.md)

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

