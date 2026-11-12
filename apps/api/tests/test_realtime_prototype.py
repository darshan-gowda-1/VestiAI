from app.ai.realtime_prototype import (
    compute_frame_flicker_l1,
    run_isolated_video_benchmark,
)
from PIL import Image


def test_isolated_realtime_prototype_measures_latency_and_flicker():
    report = run_isolated_video_benchmark(num_frames=4, width=256, height=256)
    assert report.frames_evaluated == 4
    assert report.avg_frame_ms > 0
    assert report.effective_fps > 0
    assert 0.0 <= report.mean_flicker_l1 <= 1.0


def test_identical_frames_have_zero_flicker():
    img = Image.new("RGB", (64, 64), (100, 120, 140))
    assert compute_frame_flicker_l1(img, img) == 0.0

