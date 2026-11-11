"""
VestiAI Catalog Seeder
Generates clean flat-lay PNG assets in storage ('catalog/prod-001.png' .. 'prod-012.png')
and idempotently seeds the 12 upper-body tops into the configured database.
"""
import asyncio
from io import BytesIO
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.db.session import AsyncSessionLocal
from app.services.catalog_service import CatalogService, SAMPLE_CATALOG_ITEMS
from app.services.storage_service import get_storage_backend

COLOR_MAP = {
    "Navy Blue": (30, 58, 95),
    "Warm Off-White": (239, 236, 230),
    "Sky Blue": (142, 174, 201),
    "Olive Green": (92, 109, 83),
    "Crisp White": (250, 249, 246),
    "Charcoal Grey": (51, 53, 57),
    "Heather Grey": (163, 166, 172),
    "Forest Green": (43, 67, 54),
    "Champagne Beige": (229, 214, 197),
    "Midnight Black": (31, 31, 36),
    "Navy & White Stripe": (34, 59, 96),
    "Earthy Terracotta": (168, 90, 50),
}


def render_garment_png(category: str, color_name: str) -> bytes:
    """Render a clean 768x1024 flat-lay garment PNG on neutral studio white."""
    w, h = 768, 1024
    img = Image.new("RGB", (w, h), (248, 247, 244))
    draw = ImageDraw.Draw(img)
    fill = COLOR_MAP.get(color_name, (60, 75, 95))
    outline = (42, 42, 42)

    if category == "sweatshirt":
        points = [(240, 220), (140, 320), (70, 620), (170, 650), (225, 430), (225, 860), (543, 860), (543, 430), (598, 650), (698, 620), (628, 320), (528, 220)]
    elif category == "shirt":
        points = [(245, 210), (150, 290), (85, 580), (175, 605), (225, 410), (225, 860), (543, 860), (543, 410), (593, 605), (683, 580), (618, 290), (523, 210)]
    elif category == "blouse":
        points = [(255, 220), (175, 310), (110, 520), (200, 545), (235, 410), (235, 850), (533, 850), (533, 410), (568, 545), (658, 520), (593, 310), (513, 220)]
    else:
        points = [(245, 210), (165, 300), (100, 460), (195, 505), (230, 405), (230, 840), (538, 840), (538, 405), (573, 505), (668, 460), (603, 300), (523, 210)]

    draw.polygon(points, fill=fill, outline=outline, width=4)
    draw.arc([305, 190, 463, 275], start=0, end=180, fill=(248, 247, 244), width=8)

    buf = BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


async def main() -> None:
    storage = get_storage_backend()
    for item in SAMPLE_CATALOG_ITEMS:
        png_bytes = render_garment_png(item["category"], item["color"])
        storage.put_object(item["image_key"], png_bytes, content_type="image/png")

    async with AsyncSessionLocal() as db:
        inserted = await CatalogService.seed_sample_catalog(db)
        print(f"Seeded {inserted} products (catalog assets ensured for {len(SAMPLE_CATALOG_ITEMS)} items).")


if __name__ == "__main__":
    asyncio.run(main())

