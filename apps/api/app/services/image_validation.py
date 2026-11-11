from dataclasses import dataclass
from io import BytesIO
import os
from typing import Tuple

from fastapi import UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import settings
from app.core.exceptions import PayloadTooLargeError, UnprocessableEntityError

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_PIL_FORMATS = {"JPEG", "PNG", "WEBP"}

MIN_IMAGE_DIMENSION = 128
MAX_IMAGE_DIMENSION = 4096


@dataclass
class ValidatedImage:
    content: bytes
    content_type: str
    extension: str
    width: int
    height: int


async def validate_and_sanitize_image(
    upload: UploadFile,
    *,
    max_mb: int | None = None,
    min_dim: int = MIN_IMAGE_DIMENSION,
    max_dim: int = MAX_IMAGE_DIMENSION,
) -> ValidatedImage:
    """
    Strictly validate an uploaded image (MIME, extension, size, real Pillow decode, dimensions)
    and return re-encoded bytes with EXIF/GPS metadata stripped and orientation normalized.
    """
    filename = (upload.filename or "").strip()
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise UnprocessableEntityError(
            code="INVALID_FILE_EXTENSION",
            message="Unsupported file extension. Allowed formats: JPG, PNG, WebP.",
        )

    declared_mime = (upload.content_type or "").lower().strip()
    if declared_mime not in ALLOWED_MIME_TYPES:
        raise UnprocessableEntityError(
            code="INVALID_MIME_TYPE",
            message="Unsupported media type. Allowed MIME types: image/jpeg, image/png, image/webp.",
        )

    max_bytes = (max_mb or settings.UPLOAD_MAX_MB) * 1024 * 1024
    raw_bytes = await upload.read()
    if not raw_bytes:
        raise UnprocessableEntityError(code="EMPTY_FILE", message="Uploaded file is empty.")
    if len(raw_bytes) > max_bytes:
        raise PayloadTooLargeError(
            f"Uploaded image exceeds maximum allowed size of {max_mb or settings.UPLOAD_MAX_MB} MB."
        )

    return sanitize_image_bytes(raw_bytes, min_dim=min_dim, max_dim=max_dim)


def sanitize_image_bytes(
    raw_bytes: bytes,
    *,
    min_dim: int = MIN_IMAGE_DIMENSION,
    max_dim: int = MAX_IMAGE_DIMENSION,
) -> ValidatedImage:
    """Decode raw bytes with Pillow, validate dimensions/format, transpose EXIF, and strip metadata."""
    try:
        with Image.open(BytesIO(raw_bytes)) as img:
            actual_format = (img.format or "").upper()
            if actual_format not in ALLOWED_PIL_FORMATS:
                raise UnprocessableEntityError(
                    code="UNSUPPORTED_IMAGE_FORMAT",
                    message="Decoded image format is not supported.",
                )

            # Force full image decode to catch truncated or corrupted buffers
            img.load()

            # Apply EXIF orientation without retaining EXIF metadata
            transposed = ImageOps.exif_transpose(img)
            width, height = transposed.size

            if width < min_dim or height < min_dim:
                raise UnprocessableEntityError(
                    code="IMAGE_TOO_SMALL",
                    message=f"Image dimensions ({width}x{height}) are below the minimum {min_dim}x{min_dim} requirement.",
                )
            if width > max_dim or height > max_dim:
                raise UnprocessableEntityError(
                    code="IMAGE_TOO_LARGE",
                    message=f"Image dimensions ({width}x{height}) exceed the maximum {max_dim}x{max_dim} limit.",
                )

            # Strip all EXIF/GPS metadata by re-encoding clean pixel data
            clean_buffer = BytesIO()
            if actual_format == "JPEG":
                rgb_img = transposed.convert("RGB")
                rgb_img.save(clean_buffer, format="JPEG", quality=92, optimize=True)
                out_mime = "image/jpeg"
                out_ext = ".jpg"
            elif actual_format == "WEBP":
                mode_img = transposed.convert("RGBA") if transposed.mode in ("RGBA", "LA") else transposed.convert("RGB")
                mode_img.save(clean_buffer, format="WEBP", quality=90)
                out_mime = "image/webp"
                out_ext = ".webp"
            else:
                mode_img = transposed.convert("RGBA") if transposed.mode in ("RGBA", "LA", "P") else transposed.convert("RGB")
                mode_img.save(clean_buffer, format="PNG", optimize=True)
                out_mime = "image/png"
                out_ext = ".png"

            return ValidatedImage(
                content=clean_buffer.getvalue(),
                content_type=out_mime,
                extension=out_ext,
                width=width,
                height=height,
            )
    except UnprocessableEntityError:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        raise UnprocessableEntityError(
            code="CORRUPT_IMAGE",
            message="File could not be decoded as a valid image.",
        )

