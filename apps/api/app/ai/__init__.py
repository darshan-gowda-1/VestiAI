"""
VestiAI AI Virtual Try-On Pipeline & Model Adapters
"""
from app.ai.adapter import (
    VirtualTryOnModel,
    TryOnResult,
    TryOnSettings,
    TryOnError,
    UnsupportedCategoryError,
    CorruptImageError,
    ModelCheckpointNotFoundError,
    TryOnOOMError,
    TryOnTimeoutError,
    StubTryOnModel,
    IDMVTONModel,
    CatVTONModel,
    RemoteColabTryOnModel,
    select_device,
    get_tryon_model,
)
from app.ai.pipeline import TryOnPipelineInput, TryOnPipelineOutput, TryOnPipelineService
from app.ai.preprocessing import (
    decode_image_bytes,
    generate_upper_body_mask,
    postprocess_output_image,
    preprocess_garment_image,
    preprocess_person_image,
    resize_and_pad,
)

__all__ = [
    "VirtualTryOnModel",
    "TryOnResult",
    "TryOnSettings",
    "TryOnError",
    "UnsupportedCategoryError",
    "CorruptImageError",
    "ModelCheckpointNotFoundError",
    "TryOnOOMError",
    "TryOnTimeoutError",
    "StubTryOnModel",
    "IDMVTONModel",
    "CatVTONModel",
    "RemoteColabTryOnModel",
    "select_device",
    "get_tryon_model",
    "TryOnPipelineInput",
    "TryOnPipelineOutput",
    "TryOnPipelineService",
    "decode_image_bytes",
    "resize_and_pad",
    "preprocess_person_image",
    "preprocess_garment_image",
    "generate_upper_body_mask",
    "postprocess_output_image",
]
