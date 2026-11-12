"""
Isolated Research Prototype for Real-Time Video Virtual Try-On Benchmarking (Phase 12).
This module is strictly for offline latency, FPS, and frame-to-frame flicker evaluation
and is NOT wired into the production HTTP API or webcam UI.
"""
from dataclasses import dataclass
from io import BytesIO
import time
from typing import List

from PIL import Image, ImageChops


@dataclass
class RealtimeBenchmarkReport:
    frames_evaluated: int
    total_ms: float
    avg_frame_ms: float
    effective_fps: float
    mean_flicker_l1: float
    meets_realtime_threshold: bool


def compute_frame_flicker_l1(frame_a: Image.Image, frame_b: Image.Image) -> float:
    """Compute normalized mean absolute pixel difference [0..1] between consecutive frames."""
    diff = ImageChops.difference(frame_a.convert("RGB"), frame_b.convert("RGB"))
    getter = getattr(diff, "get_flattened_data", diff.getdata)
    pixels = list(getter())
    if not pixels:
        return 0.0
    total_channel_diff = sum(r + g + b for r, g, b in pixels)
    return total_channel_diff / (len(pixels) * 3.0 * 255.0)


def run_isolated_video_benchmark(
    *,
    num_frames: int = 5,
    width: int = 512,
    height: int = 512,
    target_fps: float = 15.0,
) -> RealtimeBenchmarkReport:
    """
    Simulate an isolated frame-sampling + composition benchmark to measure
    per-frame processing overhead and temporal flicker baseline.
    """
    frames: List[Image.Image] = []
    garment = Image.new("RGBA", (width // 2, height // 2), (30, 58, 95, 220))

    start = time.perf_counter()
    for i in range(num_frames):
        frame = Image.new("RGB", (width, height), (210, 200, 195))
        # Simulate slight pose/lighting shift across sampled frames
        offset_x = (width // 4) + (i * 2)
        offset_y = height // 4
        frame.paste(garment, (offset_x, offset_y), garment)
        buf = BytesIO()
        frame.save(buf, format="JPEG", quality=85)
        buf.seek(0)
        frames.append(Image.open(buf).convert("RGB"))
    total_ms = (time.perf_counter() - start) * 1000.0

    flicker_scores = [
        compute_frame_flicker_l1(frames[i], frames[i + 1])
        for i in range(len(frames) - 1)
    ]
    mean_flicker = sum(flicker_scores) / len(flicker_scores) if flicker_scores else 0.0
    avg_frame_ms = total_ms / max(num_frames, 1)
    effective_fps = 1000.0 / avg_frame_ms if avg_frame_ms > 0 else 0.0

    # Production real-time video requires >= target_fps WITH real diffusion + temporal stability
    meets_threshold = effective_fps >= target_fps and mean_flicker < 0.05

    return RealtimeBenchmarkReport(
        frames_evaluated=num_frames,
        total_ms=round(total_ms, 2),
        avg_frame_ms=round(avg_frame_ms, 2),
        effective_fps=round(effective_fps, 2),
        mean_flicker_l1=round(mean_flicker, 4),
        meets_realtime_threshold=meets_threshold,
    )

