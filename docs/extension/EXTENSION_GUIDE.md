# VestiAI Chrome Extension (Manifest V3) — Installation & Privacy Guide

## 1. Building the Extension Locally

```bash
cd apps/extension
npm install
npm run test
npm run build
```

This generates the unpacked Manifest V3 production bundle in `apps/extension/dist/`.

---

## 2. Installing in Google Chrome (Developer Mode)

1. Open `chrome://extensions` in Google Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select `apps/extension/dist`.
4. Pin **VestiAI Virtual Try-On** to the Chrome toolbar.

---

## 3. Minimal Permissions & Privacy Disclosure (`V2-TASK-87`, `V2-TASK-104`)

VestiAI requests only the minimum Manifest V3 permissions needed:

| Permission | Purpose |
| :--- | :--- |
| `activeTab` | Grants temporary access to the current shopping tab **only** when the user clicks "Scan Page". |
| `scripting` | Injects `content.js` on-demand to list visible garment images without persistent background scraping. |
| `storage` | Stores the user's selected garment context, API URL, and JWT session token locally in Chrome storage. |
| `sidePanel` | Opens the VestiAI Side Panel for photo upload, consent confirmation, and viewing the generated try-on result. |

- **No `<all_urls>` or broad background host permissions** are requested.
- **Cross-Origin Image Restrictions:** Some external retailers block client-side `fetch()` via CORS; when blocked, the extension displays a clear fallback message rather than bypassing site restrictions.
- **User Consent:** No photograph is sent to VestiAI servers until the user explicitly checks the consent box and clicks **Generate 2D Try-On**.

