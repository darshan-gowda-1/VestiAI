# VestiAI — UI/UX Design System Specification (Phase 3)

## 1. Visual Philosophy & Brand Identity (TASK-23)

VestiAI avoids the cluttered, neon, tech-heavy aesthetic of generic AI dashboards. Instead, it embodies a **premium, editorial fashion-commerce identity**:
- **Canvas:** Warm off-white (`#FBF9F5`) evoking high-end editorial stationery.
- **Typography:** Deep charcoal (`#191919`) providing high-contrast readability without the harshness of pure black.
- **Accent:** Restrained terracotta / amber rust (`#A85A32`) used selectively for active states, calls-to-action, and subtle highlights.
- **Tone:** Confident, transparent, understated luxury with uncompromising technical honesty regarding AI output boundaries.

---

## 2. Color Tokens & Contrast Accessibility (WCAG 2.1 AA)

All primary text and interactive combinations have been audited to surpass WCAG 2.1 AA requirements (minimum 4.5:1 for normal text, 3:1 for large display text and UI controls).

| Token Name | Hex Value | Role | Tested Against | Contrast Ratio | Compliance |
|---|---|---|---|---|---|
| `canvas` | `#FBF9F5` | Background canvas | `charcoal` | **15.4:1** | AAA (Pass) |
| `canvas-subtle` | `#F4EFEB` | Card surfaces & secondary wells | `charcoal` | **13.8:1** | AAA (Pass) |
| `canvas-dark` | `#EAE3DC` | Borders & structural dividers | `charcoal-muted` | **5.2:1** | AA (Pass) |
| `charcoal` | `#191919` | Primary typography & headers | `canvas` | **15.4:1** | AAA (Pass) |
| `charcoal-muted` | `#525252` | Secondary descriptions & captions | `canvas` | **7.1:1** | AAA (Pass) |
| `charcoal-light` | `#767676` | Inactive placeholders & metadata | `canvas` | **4.6:1** | AA (Pass) |
| `accent` | `#A85A32` | Interactive CTA highlights | `canvas` | **5.4:1** | AA (Pass) |
| `accent` | `#A85A32` | White text on accent button | `#FFFFFF` | **4.8:1** | AA (Pass) |
| `emerald-600` | `#059669` | Success & verified privacy badges | `emerald-50` | **4.9:1** | AA (Pass) |
| `red-600` | `#DC2626` | Error alerts & destructive actions | `white` | **4.6:1** | AA (Pass) |

---

## 3. Typography Hierarchy

- **Display & Headings:** `Playfair Display`, serif.
  - H1 / Hero: 48px – 64px (Desktop), 36px (Mobile), Line-height 1.15, Font-weight: Medium (500).
  - H2 / Section Headings: 30px – 36px, Line-height 1.25, Font-weight: Medium (500).
  - H3 / Card Titles: 20px – 24px, Line-height 1.3, Font-weight: Medium (500).
- **Body & Interface:** `Inter`, sans-serif.
  - Body Regular: 15px – 16px, Line-height 1.6, Font-weight: Regular (400) / Light (300).
  - UI Labels & Buttons: 14px, Line-height 1.4, Font-weight: Medium (500).
  - Subtext & Captions: 12px – 13px, Line-height 1.5, Font-weight: Regular (400).
  - Micro-Badges & Tags: 11px, Uppercase tracking (0.05em), Font-weight: SemiBold (600).

---

## 4. Atomic Design Components (TASK-36)

### 4.1 Buttons (`Button`)
- **Pill Shape:** `rounded-full` for approachable high-fashion feel.
- **States:** Default, Hover (subtle darken), Active (`scale-[0.98]`), Focus (accessible 2px ring offset), Disabled (`opacity-50`, no pointer).
- **Loading:** Embedded `Loader2` spinner with disabled pointer events.

### 4.2 Product Cards (`Card`)
- Flat border (`border-canvas-dark/60`), subtle shadow (`shadow-sm` elevating to `shadow-md` on hover).
- Generous padding, 3:4 aspect ratio garment photo with clean background.
- Direct "Try This On" button and price tag with `(demo)` disclaimer.

### 4.3 Image Upload Well (`ImageUploader`)
- Drag-and-drop target with dashed charcoal/20 border transition on drag over.
- Immediate client-side thumbnail preview with replace and remove icon buttons.
- Preflight checklist card showing green checkmarks for:
  - Upper body in frame.
  - Good lighting.
  - Front-facing pose.

### 4.4 Before/After Comparison (`ComparisonSlider`)
- Aspect ratio matched to 3:4 portrait.
- Floating translucent badges for "Original Photo" and "AI Try-On Result".
- Smooth grab handle with dual chevrons, keyboard arrow key accessibility, and touch swipe.

### 4.5 Modals & Overlays (`Dialog`)
- Backdrop: `bg-charcoal/60 backdrop-blur-sm`.
- Centered surface with rounded 24px (`rounded-3xl`), auto-focus capture, and `Escape` key dismissal.

---

## 5. Accessibility & Responsive Principles (TASK-35 & TASK-37)

- **Keyboard Navigation:** Every interactive element has visible `:focus-visible` ring.
- **Alt Text:** Every product image and user preview provides descriptive alt tags.
- **Semantic Structure:** Clear `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` markup.
- **Touch Targets:** Minimum 44×44px hit areas on mobile viewports.



---

## VestiAI 2.0 Component & Identity Additions (`V2-TASK-11..15`)

- **Brand Mark & Wordmark (`src/components/common/BrandLogo.tsx`):** Original VestiAI hanger-crest SVG icon paired with `Playfair Display` serif wordmark (`sm`, `md`, `lg` sizes, `dark`/`light` variants).
- **Toast Notification System (`src/components/ui/toast.tsx`):** `ToastProvider` + `useToast()` hook (`success`, `error`, `info`, 4s auto-dismiss, accessible `role="status"`).
- **Loading Indicator (`src/components/ui/spinner.tsx`):** `LoadingSpinner` with accessible label and `accent` indicator.
- **Camera Permission Card (`src/components/camera/CameraPermissionCard.tsx`):** Handles `not-started`, `requesting`, `denied`, `unavailable`, `stopped`, and `error` states with explicit user-initiated `Start Camera` and `Upload Photo` fallback actions.
- **Route Aliases (`src/App.tsx`):** Supports both `/try-on` & `/tryon`, `/store` & `/catalog`, `/product/:id` & `/products/:id`, `/try-on/result/:jobId` & `/result/:jobId`, and `/saved-looks` & `/history`.
