from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import os
from pathlib import Path, PurePosixPath
import time
from typing import List, Optional
from urllib.parse import urlencode

from app.core.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError, UnauthorizedError


def sanitize_storage_key(key: str) -> str:
    """Normalize an object key and block path traversal attempts."""
    cleaned = key.replace("\\", "/").lstrip("/")
    pure = PurePosixPath(cleaned)
    parts = [part for part in pure.parts if part not in ("", ".")]
    if not parts or any(part == ".." for part in parts):
        raise ForbiddenError("Invalid storage key.")
    return "/".join(parts)


class StorageBackend(ABC):
    """Abstract object storage interface for local dev and S3 production."""

    @abstractmethod
    def put_object(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        pass

    @abstractmethod
    def get_object(self, key: str) -> bytes:
        pass

    @abstractmethod
    def delete_object(self, key: str) -> bool:
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        pass

    @abstractmethod
    def generate_signed_url(
        self,
        key: str,
        expires_in_seconds: int = 300,
        owner_id: Optional[str] = None,
    ) -> str:
        pass

    @abstractmethod
    def cleanup_expired_objects(self, prefixes: List[str], retention_days: int) -> int:
        pass


class LocalStorageBackend(StorageBackend):
    """Filesystem-backed private storage with HMAC-SHA256 signed URLs."""

    def __init__(self, root_dir: Optional[str] = None) -> None:
        base_path = root_dir or settings.LOCAL_STORAGE_PATH
        self.root = Path(base_path).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, key: str) -> Path:
        safe_key = sanitize_storage_key(key)
        target = (self.root / safe_key).resolve()
        if self.root not in target.parents and target != self.root:
            raise ForbiddenError("Storage path escapes configured root.")
        return target

    def put_object(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        safe_key = sanitize_storage_key(key)
        target = self._resolve_path(safe_key)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return safe_key

    def get_object(self, key: str) -> bytes:
        target = self._resolve_path(key)
        if not target.is_file():
            raise NotFoundError("Requested media object was not found.")
        return target.read_bytes()

    def delete_object(self, key: str) -> bool:
        target = self._resolve_path(key)
        if target.is_file():
            target.unlink()
            return True
        return False

    def exists(self, key: str) -> bool:
        target = self._resolve_path(key)
        return target.is_file()

    @staticmethod
    def _compute_signature(key: str, expires: int, uid: str) -> str:
        msg = f"{key}:{expires}:{uid}".encode("utf-8")
        secret = settings.AUTH_SECRET_KEY.encode("utf-8")
        return hmac.new(secret, msg, hashlib.sha256).hexdigest()

    def generate_signed_url(
        self,
        key: str,
        expires_in_seconds: int = 300,
        owner_id: Optional[str] = None,
    ) -> str:
        safe_key = sanitize_storage_key(key)
        expires = int(time.time()) + max(1, expires_in_seconds)
        uid = owner_id or ""
        sig = self._compute_signature(safe_key, expires, uid)
        query = urlencode({"key": safe_key, "expires": expires, "uid": uid, "sig": sig})
        return f"{settings.API_V1_STR}/media/signed?{query}"

    @classmethod
    def verify_signed_params(cls, key: str, expires: int, uid: str, sig: str) -> str:
        safe_key = sanitize_storage_key(key)
        if expires < int(time.time()):
            raise UnauthorizedError("Signed media URL has expired.")
        expected = cls._compute_signature(safe_key, expires, uid)
        if not hmac.compare_digest(expected, sig):
            raise ForbiddenError("Invalid media signature.")
        return safe_key

    def cleanup_expired_objects(self, prefixes: List[str], retention_days: int) -> int:
        cutoff = time.time() - (retention_days * 86400)
        removed = 0
        for prefix in prefixes:
            safe_prefix = sanitize_storage_key(prefix)
            folder = self._resolve_path(safe_prefix)
            if not folder.exists() or not folder.is_dir():
                continue
            for file_path in folder.rglob("*"):
                if file_path.is_file() and file_path.name != ".gitkeep":
                    if file_path.stat().st_mtime < cutoff:
                        file_path.unlink()
                        removed += 1
        return removed


class S3StorageBackend(StorageBackend):
    """S3-compatible private object storage backend powered by boto3."""

    def __init__(self) -> None:
        import boto3
        from botocore.config import Config

        self.bucket = settings.S3_BUCKET
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT or None,
            region_name=settings.S3_REGION,
            aws_access_key_id=settings.S3_ACCESS_KEY or None,
            aws_secret_access_key=settings.S3_SECRET_KEY or None,
            config=Config(signature_version="s3v4"),
        )

    def put_object(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        safe_key = sanitize_storage_key(key)
        self.client.put_object(
            Bucket=self.bucket,
            Key=safe_key,
            Body=data,
            ContentType=content_type,
        )
        return safe_key

    def get_object(self, key: str) -> bytes:
        safe_key = sanitize_storage_key(key)
        try:
            resp = self.client.get_object(Bucket=self.bucket, Key=safe_key)
            return resp["Body"].read()
        except Exception:
            raise NotFoundError("Requested media object was not found.")

    def delete_object(self, key: str) -> bool:
        safe_key = sanitize_storage_key(key)
        existed = self.exists(safe_key)
        self.client.delete_object(Bucket=self.bucket, Key=safe_key)
        return existed

    def exists(self, key: str) -> bool:
        safe_key = sanitize_storage_key(key)
        try:
            self.client.head_object(Bucket=self.bucket, Key=safe_key)
            return True
        except Exception:
            return False

    def generate_signed_url(
        self,
        key: str,
        expires_in_seconds: int = 300,
        owner_id: Optional[str] = None,
    ) -> str:
        safe_key = sanitize_storage_key(key)
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": safe_key},
            ExpiresIn=max(1, expires_in_seconds),
        )

    def cleanup_expired_objects(self, prefixes: List[str], retention_days: int) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
        removed = 0
        paginator = self.client.get_paginator("list_objects_v2")
        for prefix in prefixes:
            safe_prefix = sanitize_storage_key(prefix)
            for page in paginator.paginate(Bucket=self.bucket, Prefix=safe_prefix):
                for obj in page.get("Contents", []):
                    if obj["LastModified"] < cutoff:
                        self.client.delete_object(Bucket=self.bucket, Key=obj["Key"])
                        removed += 1
        return removed


def get_storage_backend() -> StorageBackend:
    """Return the configured object storage backend."""
    if settings.STORAGE_BACKEND.lower().strip() == "s3":
        return S3StorageBackend()
    return LocalStorageBackend()
