# VestiAI — 5-Minute Live Demo Walkthrough Script

## Pre-Demo Checklist
1. Ensure backend API (`uvicorn app.main:app --reload`) and frontend (`npm run dev`) are running (or Docker Compose stack is up).
2. Confirm sample tops catalog is seeded (`python scripts/seed_catalog.py`).
3. Have a sample front-facing upper-body photo ready (`JPEG`/`PNG`).

---

## Step-by-Step Walkthrough

### 1. Landing & Scope Transparency (0:00 – 0:45)
- Open `http://localhost:5173`.
- Highlight the clean editorial UI, supported categories (**Tops only**: T-shirts, shirts, sweatshirts, blouses), and honest 2D visual preview disclaimer (no 3D/size guarantees).

### 2. Catalog Browsing & Filtering (0:45 – 1:30)
- Navigate to `/catalog`.
- Demonstrate category filtering and keyword search.
- Click any top to inspect product details and click **Try On This Garment**.

### 3. Auth, Consent & Upload Guidance (1:30 – 2:30)
- Register or sign in on `/auth`.
- Open `/try-on`: point out the **Privacy Consent** gate and **Guidance Card** (good lighting, front-facing pose, plain background).
- Upload a front-facing photo in `ImageUploader` to show instant client-side preview and MIME/size validation.

### 4. Async Processing & Interactive Comparison (2:30 – 4:00)
- Submit the try-on job.
- Show `JobProgressView` transitioning through `queued` -> `processing` -> `completed` without fake percentages.
- Drag the **ComparisonSlider** left and right to compare the original photo against the generated 2D try-on output.

### 5. Saved Looks, Deletion & Admin View (4:00 – 5:00)
- Save the result to History (`/history`) and demonstrate deleting a job (removes DB record + private stored media).
- Briefly show `/admin` (for admin users) displaying catalog management and job monitoring.

