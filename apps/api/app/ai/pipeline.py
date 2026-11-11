import asyncio
from dataclasses import dataclass, field
import time
from typing import Any, Dict, Optional

from app.ai.adapter import (
    TryOnError,
    TryOnResult,
    TryOnSettings,
    TryOnTimeoutError,
    VirtualTryOnModel,
    get_tryon_model,
)
from app.ai.preprocessing import (
    generate_upper_body_mask,
    postprocess_output_image,
    preprocess_garment_image,
    preprocess_person_image,
)
from app.core.config import settings as app_settings
from app.core.logging import logger
from app.services.storage_service import StorageBackend, get_storage_backend


@dataclass
class TryOnPipelineInput:
    person_image_key: str
    garment_image_key: str
    output_image_key: str
    category: str = "upper_body"
    settings: TryOnSettings = field(default_factory=TryOnSettings)
    timeout_seconds: Optional[float] = None


@dataclass
class TryOnPipelineOutput:
    success: bool
    result_image_key: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    model_name: str = ""
    model_version: str = ""
    is_simulated: bool = False
    preprocess_ms: float = 0.0
    inference_ms: float = 0.0
    postprocess_ms: float = 0.0
    total_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class TryOnPipelineService:
    """
    Modular end-to-end 2D virtual try-on execution pipeline.
    Coordinates storage retrieval, preprocessing, timed inference, postprocessing, and output persistence.
    """

    def __init__(
        self,
        model: Optional[VirtualTryOnModel] = None,
        storage: Optional[StorageBackend] = None,
    ) -> None:
        self.model = model or get_tryon_model()
        self.storage = storage or get_storage_backend()

    async def run(self, payload: TryOnPipelineInput) -> TryOnPipelineOutput:
        total_start = time.perf_counter()
        timeout_sec = payload.timeout_seconds or float(app_settings.INFERENCE_TIMEOUT_SECONDS)
        target_size = (payload.settings.width, payload.settings.height)
        model_info = self.model.get_model_info()

        preprocess_ms = 0.0
        inference_ms = 0.0
        postprocess_ms = 0.0

        try:
            # 1. Fetch input bytes and preprocess
            t0 = time.perf_counter()
            person_bytes = self.storage.get_object(payload.person_image_key)
            garment_bytes = self.storage.get_object(payload.garment_image_key)

            person_img = preprocess_person_image(person_bytes, target_size=target_size)
            garment_img = preprocess_garment_image(garment_bytes, target_size=target_size)
            mask_img = generate_upper_body_mask(target_size=target_size)
            preprocess_ms = round((time.perf_counter() - t0) * 1000.0, 2)

            # 2. Execute model inference with timeout guard
            t1 = time.perf_counter()
            try:
                result: TryOnResult = await asyncio.wait_for(
                    asyncio.to_thread(
                        self.model.generate,
                        person_img,
                        garment_img,
                        payload.category,
                        payload.settings,
                    ),
                    timeout=timeout_sec,
                )
            except asyncio.TimeoutError:
                raise TryOnTimeoutError(timeout_sec)
            inference_ms = round((time.perf_counter() - t1) * 1000.0, 2)

            # 3. Postprocess output and persist securely in private storage
            t2 = time.perf_counter()
            output_png = postprocess_output_image(result.output_image, expected_size=target_size)
            stored_key = self.storage.put_object(
                payload.output_image_key,
                output_png,
                content_type="image/png",
            )
            postprocess_ms = round((time.perf_counter() - t2) * 1000.0, 2)
            total_ms = round((time.perf_counter() - total_start) * 1000.0, 2)

            logger.info(
                "TryOnPipeline completed | model=%s simulated=%s total_ms=%.2f output_key=%s",
                result.model_name,
                result.is_simulated,
                total_ms,
                stored_key,
            )

            return TryOnPipelineOutput(
                success=True,
                result_image_key=stored_key,
                width=target_size[0],
                height=target_size[1],
                model_name=result.model_name,
                model_version=result.model_version,
                is_simulated=result.is_simulated,
                preprocess_ms=preprocess_ms,
                inference_ms=inference_ms,
                postprocess_ms=postprocess_ms,
                total_ms=total_ms,
                metadata={
                    **result.metrics,
                    "mask_size": f"{mask_img.width}x{mask_img.height}",
                    "category": payload.category,
                },
            )

        except TryOnError as exc:
            total_ms = round((time.perf_counter() - total_start) * 1000.0, 2)
            logger.warning("TryOnPipeline domain failure | code=%s total_ms=%.2f", exc.code, total_ms)
            return TryOnPipelineOutput(
                success=False,
                model_name=str(model_info.get("name", "unknown")),
                model_version=str(model_info.get("version", "unknown")),
                is_simulated=bool(model_info.get("is_simulated", False)),
                preprocess_ms=preprocess_ms,
                inference_ms=inference_ms,
                postprocess_ms=postprocess_ms,
                total_ms=total_ms,
                error_code=exc.code,
                error_message=exc.message,
            )
        except Exception as exc:
            total_ms = round((time.perf_counter() - total_start) * 1000.0, 2)
            logger.error("TryOnPipeline unexpected failure | type=%s total_ms=%.2f", type(exc).__name__, total_ms)
            return TryOnPipelineOutput(
                success=False,
                model_name=str(model_info.get("name", "unknown")),
                model_version=str(model_info.get("version", "unknown")),
                is_simulated=bool(model_info.get("is_simulated", False)),
                preprocess_ms=preprocess_ms,
                inference_ms=inference_ms,
                postprocess_ms=postprocess_ms,
                total_ms=total_ms,
                error_code="PIPELINE_INTERNAL_ERROR",
                error_message="Virtual try-on processing failed unexpectedly. Please retry.",
            )
