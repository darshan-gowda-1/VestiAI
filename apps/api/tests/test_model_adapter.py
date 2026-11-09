import os
import pytest
from PIL import Image

from app.ai.adapter import (
    VirtualTryOnModel,
    StubTryOnModel,
    IDMVTONModel,
    CatVTONModel,
    get_tryon_model,
    UnsupportedCategoryError,
    CorruptImageError,
    TryOnOOMError,
    TryOnSettings,
)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "test_data")
PERSON_PATH = os.path.join(FIXTURES_DIR, "person_01.png")
GARMENT_PATH = os.path.join(FIXTURES_DIR, "garment_01.png")


@pytest.fixture
def test_images():
    assert os.path.exists(PERSON_PATH), "Person fixture image missing"
    assert os.path.exists(GARMENT_PATH), "Garment fixture image missing"
    person = Image.open(PERSON_PATH)
    garment = Image.open(GARMENT_PATH)
    return person, garment


def test_stub_model_info():
    model = StubTryOnModel()
    info = model.get_model_info()
    assert info["name"] == "deterministic-test-stub"
    assert info["is_simulated"] is True
    assert info["device"] == "cpu"
    assert "version" in info


def test_stub_model_successful_generation(test_images):
    person, garment = test_images
    model = StubTryOnModel()
    
    settings = TryOnSettings(width=768, height=1024)
    result = model.generate(
        person_image=person,
        garment_image=garment,
        category="upper_body",
        settings=settings,
    )

    assert result is not None
    assert isinstance(result.output_image, Image.Image)
    assert result.output_image.size == (768, 1024)
    assert result.is_simulated is True
    assert result.processing_time_ms > 0
    assert result.model_name == "deterministic-test-stub"
    assert result.output_resolution == "768x1024"
    assert "fidelity_score" in result.metrics

    # Save output to verify a physical file is produced
    output_verify_path = os.path.join(FIXTURES_DIR, "test_result_preview.png")
    result.output_image.save(output_verify_path)
    assert os.path.exists(output_verify_path)


def test_supported_categories(test_images):
    person, garment = test_images
    model = StubTryOnModel()
    
    # All upper-body variations should succeed
    for category in ["tops", "t-shirt", "shirt", "blouse", "sweatshirt", "upper_body"]:
        result = model.generate(person, garment, category=category)
        assert result.output_image is not None


def test_unsupported_category_rejection(test_images):
    person, garment = test_images
    model = StubTryOnModel()
    
    with pytest.raises(UnsupportedCategoryError) as exc_info:
        model.generate(person, garment, category="shoes")
    assert exc_info.value.code == "UNSUPPORTED_CATEGORY"

    with pytest.raises(UnsupportedCategoryError) as exc_info:
        model.generate(person, garment, category="jeans")
    assert exc_info.value.code == "UNSUPPORTED_CATEGORY"


def test_corrupt_or_tiny_image_rejection(test_images):
    _, garment = test_images
    model = StubTryOnModel()
    
    # Too small image (less than 128x128)
    tiny_img = Image.new("RGB", (64, 64))
    with pytest.raises(CorruptImageError) as exc_info:
        model.generate(tiny_img, garment, category="tops")
    assert exc_info.value.code == "CORRUPT_IMAGE"


def test_idm_vton_model_info():
    model = IDMVTONModel()
    info = model.get_model_info()
    assert info["name"] == "idm-vton"
    assert info["is_simulated"] is False
    assert "TryonNet + GarmentNet" in info["architecture"]
    assert "CC BY-NC-SA 4.0" in info["license"]


def test_catvton_model_info():
    model = CatVTONModel()
    info = model.get_model_info()
    assert info["name"] == "catvton"
    assert info["is_simulated"] is False
    assert "Single-stream" in info["architecture"]


def test_model_factory():
    stub = get_tryon_model("stub")
    assert isinstance(stub, StubTryOnModel)

    idm = get_tryon_model("idm-vton")
    assert isinstance(idm, IDMVTONModel)

    cat = get_tryon_model("catvton")
    assert isinstance(cat, CatVTONModel)

    fallback = get_tryon_model("nonexistent-model")
    assert isinstance(fallback, StubTryOnModel)
