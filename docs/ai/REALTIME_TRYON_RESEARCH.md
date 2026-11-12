# VestiAI 2.0 — Real-Time Video Virtual Try-On Research & Feasibility Memo

## 1. Objective (`V2-TASK-117..123`)
Investigate whether VestiAI can evolve from asynchronous 2D image-based virtual try-on (`IDM-VTON` / `CatVTON`) to continuous, low-latency real-time webcam garment rendering, without replacing the stable image pipeline prematurely or faking live AI over a webcam feed.

---

## 2. Candidate Architecture Comparison

| Approach / Model | Typical Per-Frame Latency | Effective FPS | GPU VRAM Required | Temporal Consistency | Licensing & Cost |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **IDM-VTON (Single-Image Diffusion)** | ~8,000 – 18,000 ms (T4/4050) | `< 0.15 FPS` | 6–16 GB | None (per-frame flicker) | CC BY-NC-SA 4.0 (Non-commercial) |
| **CatVTON (Concat Diffusion)** | ~4,000 – 10,000 ms (T4) | `< 0.25 FPS` | 8–12 GB | None (per-frame flicker) | Research / Check weights |
| **Video Diffusion / Commercial Streaming (e.g., Lucy 2.0 API)** | ~40 – 120 ms (Cloud A100/H100 cluster) | `10 – 25 FPS` | Managed Cloud GPU | Temporal attention | Proprietary paid API |
| **2D Warp + Pose Keypoints (MediaPipe + TPS)** | ~15 – 35 ms (CPU/WebGL) | `25 – 60 FPS` | `< 1 GB` | Smooth but looks like a 2D sticker | Apache 2.0 / MIT |

---

## 3. Isolated Prototype & Flicker Findings (`apps/api/app/ai/realtime_prototype.py`)

An isolated Python prototype (`run_isolated_video_benchmark`) was implemented to measure frame sampling, JPEG encode/decode overhead, and normalized L1 frame-to-frame flicker (`compute_frame_flicker_l1`). Even before running heavy diffusion UNet steps, small pose offsets introduce measurable pixel-level temporal delta; running multi-step diffusion independently per frame produces severe garment texture and sleeve flickering unless cross-frame temporal attention and optical-flow warping are used.

---

## 4. Evidence-Based Integration Decision (`V2-TASK-123`)

**Decision: Keep the Two-Mode Architecture (Live Camera Framing + Async 2D Image Try-On). Do NOT integrate continuous real-time diffusion video try-on into production at this stage.**

- **Why:** Consumer hardware (RTX 4050 6GB) and free academic cloud GPUs (Colab T4 16GB) cannot sustain 15+ FPS diffusion inference, and naive 2D sticker overlays violate VestiAI's commitment to honest visual results.
- **Path Forward:** Continue using `LiveCameraStage` for responsive framing + drag-and-drop garment selection, and trigger `TryOnPipelineService` on captured frames for high-fidelity 2D results. Revisit real-time video only if dedicated low-latency video-try-on GPUs or licensed streaming APIs are provisioned.
