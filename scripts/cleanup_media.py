"""
VestiAI Media Retention Cleanup Script
Deletes expired private uploads and try-on results older than RESULT_RETENTION_DAYS.
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.core.config import settings
from app.services.storage_service import get_storage_backend


def main() -> None:
    storage = get_storage_backend()
    removed = storage.cleanup_expired_objects(
        prefixes=["user-uploads", "tryon-results"],
        retention_days=settings.RESULT_RETENTION_DAYS,
    )
    print(f"Cleanup completed: removed {removed} expired object(s) older than {settings.RESULT_RETENTION_DAYS} days.")


if __name__ == "__main__":
    main()

