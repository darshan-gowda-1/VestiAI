from io import BytesIO
from typing import Tuple

from PIL import Image, ImageDraw, ImageOps, UnidentifiedImageError

from app.ai.adapter import CorruptImageError

DEFAULT_TARGET_SIZE: Tuple[int, int] = (768, 1024)
MIN_INPUT_DIMENSION = 128


def decode_image_bytes(raw_bytes: bytes, label: str = "image") -> Image.Image:
    """Safely decode raw bytes into a loaded, EXIF-transposed PIL Image."""
    if not raw_bytes:
        raise CorruptImageError(f"Empty {label} payload.")
    try:
        with Image.open(BytesIO(raw_bytes)) as img:
            img.load()
            transposed = ImageOps.exif_transpose(img)
            if transposed.width < MIN_INPUT_DIMENSION or transposed.height < MIN_INPUT_DIMENSION:
                raise CorruptImageError(
                    f"{label.capitalize()} dimensions {transposed.size} are below {MIN_INPUT_DIMENSION}px minimum."
                )
            return transposed.copy()
    except CorruptImageError:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        raise CorruptImageError(f"{label.capitalize()} bytes are corrupted or unreadable.")


def resize_and_pad(
    img: Image.Image,
    target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE,
    background_color: Tuple[int, int, int] = (248, 247, 244),
) -> Image.Image:
    """
    Resize image preserving aspect ratio (no stretching) and center-pad onto target canvas.
    Alpha channels are composited cleanly against background_color.
    """
    target_w, target_h = target_size

    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (*background_color, 255))
        composited = Image.alpha_composite(bg, rgba).convert("RGB")
    else:
        composited = img.convert("RGB")

    contained = ImageOps.contain(composited, (target_w, target_h), method=Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (target_w, target_h), background_color)
    offset_x = (target_w - contained.width) // 2
    offset_y = (target_h - contained.height) // 2
    canvas.paste(contained, (offset_x, offset_y))
    return canvas


def preprocess_person_image(
    raw_bytes: bytes,
    target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE,
) -> Image.Image:
    """Decode and normalize a person portrait to model-ready 3:4 RGB canvas."""
    decoded = decode_image_bytes(raw_bytes, label="person image")
    return resize_and_pad(decoded, target_size=target_size, background_color=(245, 245, 243))


def preprocess_garment_image(
    raw_bytes: bytes,
    target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE,
) -> Image.Image:
    """Decode and normalize a flat-lay garment onto studio white 3:4 RGB canvas."""
    decoded = decode_image_bytes(raw_bytes, label="garment image")
    return resize_and_pad(decoded, target_size=target_size, background_color=(255, 255, 255))


def generate_upper_body_mask(
    target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE,
) -> Image.Image:
    """Generate a conservative upper-body torso inpainting mask for diffusion models."""
    w, h = target_size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        [int(w * 0.14), int(h * 0.25), int(w * 0.86), int(h * 0.78)],
        radius=int(w * 0.08),
        fill=255,
    )
    return mask


def postprocess_output_image(
    output_img: Image.Image,
    expected_size: Tuple[int, int] = DEFAULT_TARGET_SIZE,
) -> bytes:
    """
    Validate model output image, normalize to exact RGB display dimensions,
    and encode as optimized PNG bytes.
    """
    if not isinstance(output_img, Image.Image):
        raise CorruptImageError("Model output is not a valid image.")

    rgb = output_img.convert("RGB")
    if rgb.size != expected_size:
        rgb = resize_and_pad(rgb, target_size=expected_size, background_color=(245, 245, 243))

    buf = BytesIO()
    rgb.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

