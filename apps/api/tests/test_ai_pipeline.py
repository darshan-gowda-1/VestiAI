from io import BytesIO
import os
import time
from unittest.mock import patch

from PIL import Image
import pytest

from app.ai.adapter import (
    RemoteColabTryOnModel,
    StubTryOnModel,
    TryOnOOMError,
    TryOnSettings,
    VirtualTryOnModel,
    get_tryon_model,
    select_device,
)
from app.ai.pipeline import TryOnPipelineInput, TryOnPipelineService
from app.ai.preprocessing import (
    postprocess_output_image,
    preprocess_garment_image,
    preprocess_person_image,
)
from app.services.storage_service import LocalStorageBackend

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "test_data")


def _img_bytes(size=(400, 400), mode="RGB", color=(120, 140, 160), fmt="PNG") -> bytes:
    buf = BytesIO()
    Image.new(mode, size, color).save(buf, format=fmt)
    return buf.getvalue()


def test_preprocessing_preserves_aspect_ratio_and_rgba_transparency():
    # Wide landscape photo -> 768x1024 padded RGB without stretching
    wide_bytes = _img_bytes(size=(800, 400))
    person_out = preprocess_person_image(wide_bytes, target_size=(768, 1024))
    assert person_out.size == (768, 1024)
    assert person_out.mode == "RGB"

    # Transparent RGBA garment -> composited onto white studio canvas
    rgba_garment = Image.new("RGBA", (300, 300), (0, 0, 0, 0))
    rgba_garment.putpixel((150, 150), (20, 40, 80, 255))
    buf = BytesIO()
    rgba_garment.save(buf, format="PNG")
    garment_out = preprocess_garment_image(buf.getvalue(), target_size=(768, 1024))
    assert garment_out.size == (768, 1024)
    assert garment_out.mode == "RGB"
    # Corner pixel should be pure white background
    assert garment_out.getpixel((0, 0)) == (255, 255, 255)

    # Postprocessing verifies PNG encoding
    png_bytes = postprocess_output_image(person_out, expected_size=(768, 1024))
    decoded = Image.open(BytesIO(png_bytes))
    assert decoded.format == "PNG"
    assert decoded.size == (768, 1024)


def test_device_selection_and_warmup():
    cpu_info = select_device("cpu")
    assert cpu_info["device"] == "cpu"

    stub = StubTryOnModel()
    warmup_info = stub.warm_up()
    assert warmup_info["status"] == "ready"
    assert warmup_info["warmup_ms"] >= 0
    assert warmup_info["model"]["is_simulated"] is True


@pytest.mark.asyncio
async def test_pipeline_end_to_end_across_categories(tmp_path):
    storage = LocalStorageBackend(root_dir=str(tmp_path))
    with open(os.path.join(FIXTURES_DIR, "person_01.png"), "rb") as f:
        person_key = storage.put_object("user-uploads/u1/person.png", f.read(), "image/png")
    with open(os.path.join(FIXTURES_DIR, "garment_01.png"), "rb") as f:
        garment_key = storage.put_object("catalog/garment.png", f.read(), "image/png")

    pipeline = TryOnPipelineService(model=StubTryOnModel(), storage=storage)

    for cat in ("t-shirt", "shirt", "sweatshirt", "blouse"):
        out_key = f"tryon-results/u1/result_{cat}.png"
        output = await pipeline.run(
            TryOnPipelineInput(
                person_image_key=person_key,
                garment_image_key=garment_key,
                output_image_key=out_key,
                category=cat,
                settings=TryOnSettings(width=768, height=1024),
            )
        )
        assert output.success is True
        assert output.result_image_key == out_key
        assert output.width == 768
        assert output.height == 1024
        assert output.is_simulated is True
        assert output.total_ms > 0
        assert storage.exists(out_key)


@pytest.mark.asyncio
async def test_pipeline_error_handling_oom_timeout_category_and_corrupt(tmp_path):
    storage = LocalStorageBackend(root_dir=str(tmp_path))
    person_key = storage.put_object("user-uploads/u1/p.png", _img_bytes((300, 400)))
    garment_key = storage.put_object("catalog/g.png", _img_bytes((300, 400)))
    corrupt_key = storage.put_object("user-uploads/u1/bad.png", b"not-an-image")

    pipeline = TryOnPipelineService(model=StubTryOnModel(), storage=storage)

    # 1. Unsupported category
    bad_cat = await pipeline.run(
        TryOnPipelineInput(
            person_image_key=person_key,
            garment_image_key=garment_key,
            output_image_key="tryon-results/u1/fail1.png",
            category="sneakers",
        )
    )
    assert bad_cat.success is False
    assert bad_cat.error_code == "UNSUPPORTED_CATEGORY"

    # 2. Corrupt image bytes
    bad_img = await pipeline.run(
        TryOnPipelineInput(
            person_image_key=corrupt_key,
            garment_image_key=garment_key,
            output_image_key="tryon-results/u1/fail2.png",
            category="shirt",
        )
    )
    assert bad_img.success is False
    assert bad_img.error_code == "CORRUPT_IMAGE"

    # 3. GPU OOM error recovery
    class OOMModel(StubTryOnModel):
        def generate(self, person_image, garment_image, category, settings=None):
            raise TryOnOOMError("Simulated CUDA out of memory")

    oom_pipeline = TryOnPipelineService(model=OOMModel(), storage=storage)
    oom_res = await oom_pipeline.run(
        TryOnPipelineInput(
            person_image_key=person_key,
            garment_image_key=garment_key,
            output_image_key="tryon-results/u1/fail3.png",
            category="t-shirt",
        )
    )
    assert oom_res.success is False
    assert oom_res.error_code == "GPU_OUT_OF_MEMORY"

    # 4. Timeout enforcement
    class SlowModel(StubTryOnModel):
        def generate(self, person_image, garment_image, category, settings=None):
            time.sleep(0.4)
            return super().generate(person_image, garment_image, category, settings)

    slow_pipeline = TryOnPipelineService(model=SlowModel(), storage=storage)
    timeout_res = await slow_pipeline.run(
        TryOnPipelineInput(
            person_image_key=person_key,
            garment_image_key=garment_key,
            output_image_key="tryon-results/u1/fail4.png",
            category="t-shirt",
            timeout_seconds=0.05,
        )
    )
    assert timeout_res.success is False
    assert timeout_res.error_code == "INFERENCE_TIMEOUT"


def test_remote_colab_adapter(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.REMOTE_INFERENCE_URL", "https://colab-demo.ngrok.io")
    model = get_tryon_model("remote")
    assert isinstance(model, RemoteColabTryOnModel)

    person = Image.new("RGB", (256, 256))
    garment = Image.new("RGB", (256, 256))
    result_png = _img_bytes((768, 1024))

    class FakeResp:
        status_code = 200
        content = result_png

    with patch("httpx.Client.post", return_value=FakeResp()):
        res = model.generate(person, garment, category="upper_body")
        assert res.model_name == "remote-gpu-worker"
        assert res.output_image.size == (768, 1024)
        assert res.is_simulated is False
