# VestiAI — Screen Specifications & Wireframe Blueprints (Phase 3)

This document specifies the wireframes, components, user actions, and state transitions for all twelve screens (S01–S12) defined in the VestiAI blueprint.

---

## Screen S01: Landing Page (TASK-24)
- **Header:** Brand wordmark (`VestiAI`), links (`Catalog`, `Try-On Studio`, `How It Works`, `Privacy`), user session button.
- **Hero Section:**
  - Headline: *"See the fit before you commit."*
  - Subhead: 2D diffusion-powered upper-body try-on preview for e-commerce tops.
  - CTAs: Primary "Try In Studio" (navigates to `/tryon`), Secondary "Browse Tops" (`/catalog`).
  - Trust badge: *"Consent-based processing • Private storage • 2D Visual Preview"*.
- **3-Step "How It Works" Cards:**
  1. *Choose Garment:* Select from shirts, t-shirts, sweatshirts, and blouses.
  2. *Upload Frontal Photo:* Upload a clear front-facing portrait.
  3. *Review AI Preview:* Compare before & after with our interactive slider.
- **Featured Products Carousel/Grid:** Top 4 trending catalog items with quick "Try This On" buttons.
- **Footer:** Academic college mini-project notice, MIT license, links to architecture and privacy policy.

---

## Screen S02: Catalog Page (TASK-25)
- **Top Bar:** Search input (real-time filtering), Category Pills (`All Tops`, `T-Shirts`, `Shirts`, `Sweatshirts`, `Blouses`).
- **Sort Dropdown:** `Featured`, `Price: Low to High`, `Price: High to Low`, `Newest`.
- **Product Grid:** Responsive layout (1 col on mobile, 2 on tablet, 4 on desktop).
  - Each item: Card with high-res garment photo, category badge, title, colorway, demo price, and "Try On" CTA.
- **Empty State:** Friendly hanger illustration when search query has 0 matches with "Reset Filters" action.
- **Loading State:** Shimmer skeletons preserving grid dimensions.

---

## Screen S03: Product Detail Page (TASK-26)
- **Two-Column Editorial Layout:**
  - Left Column (Desktop): Large 3:4 high-res garment photograph with thumbnail gallery.
  - Right Column:
    - Garment Category chip & Title (e.g., *"Classic Oxford Cotton Button-Down"*).
    - Demo Price tag & Brand attribution.
    - Color options swatch preview.
    - Garment specifications (Material: 100% Cotton, Fit: Regular, Neckline: Button-down).
    - Primary CTA: Large "Try This On with Your Photo" button leading directly into `/tryon?productId={id}`.
    - Secondary CTA: Wishlist heart toggle.
    - Fit Disclaimer notice: *"VestiAI renders a 2D visual aid. Refer to retailer size charts for exact measurements."*
- **Related Products Shelf:** 3–4 items in the same category.

---

## Screen S04: Try-On Workspace (TASK-27 & TASK-28)
- **Split Workspace Layout (Desktop) / Tabbed Steps (Mobile):**
  - **Left Pane — Person Photo Input:**
    - Drag & drop dropzone or file picker.
    - Client preflight checklist (Frontal pose, clear upper torso, good lighting).
    - Image preview once chosen, with "Replace" and "Remove" quick actions.
    - Mandatory Consent Checkbox: *"I confirm that I own or have permission to use this photograph, and I consent to temporary AI processing for virtual try-on."*
  - **Right Pane — Selected Garment:**
    - Displays active garment thumbnail, title, and color.
    - "Change Garment" button opening a fast modal selector of catalog tops.
  - **Action Area:**
    - Prominent "Generate Try-On Preview" button (disabled until photo uploaded & consent checked).

---

## Screen S05: Job Progress State (TASK-29)
- **State Display:** Centered progress card replacing or overlaying the workspace.
- **Phases:**
  - `Queued`: *"Job scheduled in queue... Waiting for inference worker."*
  - `Processing`: *"AI Diffusion model is synthesizing garment drape and lighting..."*
- **Visuals:** Subtle pulsating animation, job UUID reference, elapsed seconds counter.
- **Action:** "Cancel Request" (returns to workspace safely).
- **Rule:** Never displays fake percentages; reflects actual backend queue state.

---

## Screen S06: Result Screen (TASK-30)
- **Central Feature:** `ComparisonSlider` component rendering:
  - Left side: Original uploaded photograph.
  - Right side: Generated try-on output.
  - Interactive draggable splitter with touch support.
- **Action Bar:**
  - "Save to My Looks" (persists to user collection).
  - "Download Result" (saves high-res PNG with subtle VestiAI badge).
  - "Try Another Top" (retains uploaded person photo, opens garment picker).
  - "Delete This Result" (purges media from server storage).
- **Advisory Banner:**
  - *"Note: This AI visualization represents color, pattern, and general drape. It is not an exact fit simulation."*

---

## Screen S07: Authentication Pages (TASK-32)
- **Login (`/login`):** Email, password, "Sign In" button, demo guest login shortcut, link to register.
- **Register (`/register`):** Name, email, password, confirm password, terms agreement, "Create Account" button.
- **Design:** Clean minimalist card centered on the warm canvas.

---

## Screen S08: History Page (TASK-31)
- **Grid of Past Looks:** Thumbnail cards showing generated output, garment worn, date/time timestamp.
- **Actions per Card:** "View Comparison", "Download", "Delete".
- **Empty State:** Friendly illustration with "You haven't tried on any clothes yet" and a "Start Try-On" button.

---

## Screen S09: Wishlist Page (TASK-31)
- **Grid of Saved Garments:** Products saved by the user with one-click "Try This On" button and "Remove" action.

---

## Screen S10: Admin Dashboard (TASK-34)
- **Tabs:**
  1. *Product Inventory:* Table of catalog tops (Title, Category, Color, Price, Active toggle, Edit, Archive).
  2. *Job Monitor:* Real-time list of try-on jobs (Job ID, Created timestamp, Duration, Status, Error code). No private user photos shown to preserve privacy.
  3. *Add Product Modal:* Form for title, description, category, color, price, and flat-lay image upload.

---

## Screen S11: Profile & Privacy Controls (TASK-33)
- **User Information:** Email, account created date.
- **Privacy & Data Governance Panel:**
  - Active consent status toggle.
  - "Purge All My Uploads & History" button with confirmation dialog (deletes all DB records and storage files).
  - Download account metadata archive.

---

## Screen S12: Error & Boundary States (TASK-37)
- **401 Unauthorized:** "Please sign in to access your saved looks."
- **404 Not Found:** "Product or look not found. Return to Catalog."
- **413 Payload Too Large:** "Image exceeds 10 MB limit. Please choose a smaller photo."
- **422 Unsupported Pose/Category:** "Garment category must be an upper-body top. Please select a t-shirt or shirt."
- **500 Worker Error:** "AI model timed out or encountered an issue. Please retry."
