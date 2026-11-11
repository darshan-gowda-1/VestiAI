# VestiAI — Security, Privacy & Responsible Use Policy (Phase 12)

## 1. Consent & Purpose Limitation (TASK-163 & TASK-164)
- **Explicit Opt-In Consent:** No personal photograph may be uploaded to or processed by the try-on pipeline without active, affirmative consent (`consent=true`).
- **Auditability:** Every try-on job writes an immutable timestamped `consent_records` entry linking the user, job, consent version (`v1.0`), and purpose (`2d_virtual_tryon_processing`).
- **No Training Use:** User-uploaded portraits and generated outputs are never added to training datasets or shared with third-party model vendors.

---

## 2. Image Retention & Deletion Policy (TASK-165)
- **Configurable Retention Window:** By default (`RESULT_RETENTION_DAYS=7`), temporary user uploads (`user-uploads/`) and generated outputs (`tryon-results/`) are automatically purged after **7 days** by `scripts/cleanup_media.py`.
- **Immediate User Erasure:** Shoppers may delete individual jobs (`DELETE /api/v1/tryon/jobs/{id}`) or purge all their uploads and history (`DELETE /api/v1/tryon/jobs`) at any time. Deletion removes both database metadata and physical object storage files.

---

## 3. Storage & Access Controls (TASK-166 & TASK-167)
- **Private By Default:** User uploads and generated outputs are stored under private storage prefixes (`user-uploads/`, `tryon-results/`) and are never exposed via public static URLs.
- **Short-Lived Signed URLs:** Authorized media retrieval requires either an S3 presigned URL or an HMAC-SHA256 signed URL (`/api/v1/media/signed`) expiring within 5–10 minutes.
- **Strict Ownership:** Every job, saved look, and wishlist endpoint validates `ensure_owner_or_admin` to prevent cross-user IDOR access.
- **Admin Minimization:** Administrative job monitoring (`GET /api/v1/admin/jobs`) intentionally omits `user_id`, `email`, and private image keys/URLs.

---

## 4. Input Sanitization, Rate Limiting & Hardening (TASK-168 – TASK-172)
- **Image Decoding & EXIF Stripping:** Uploads undergo MIME, extension, byte-size (`UPLOAD_MAX_MB=10`), dimension (`128..4096`), and full Pillow pixel verification, followed by EXIF orientation transposition and stripping of all GPS/camera metadata.
- **Rate Limiting:** Sliding-window per-IP rate limits protect `/auth/login`, `/auth/register`, `/media/uploads`, and `/tryon/jobs`, returning `429 RATE_LIMIT_EXCEEDED` with `Retry-After`.
- **Security Headers & Safe Logging:** Responses include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy`. Logs never record image bytes, passwords, tokens, or signed URL signatures.
- **Production Secrets Guard:** Startup aborts if `ENVIRONMENT=production` while `AUTH_SECRET_KEY` remains at its default template value.

---

## 5. Licensing & Responsible Use (TASK-173 & TASK-174)
- **Code & Weights:** VestiAI source code is MIT licensed; candidate diffusion checkpoints (IDM-VTON, CatVTON) carry `CC BY-NC-SA 4.0` non-commercial academic research terms.
- **Visual Aid Only:** Outputs represent 2D aesthetic garment previews and must never be represented as exact body measurements or certified tailoring fit.

