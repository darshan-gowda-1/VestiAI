import threading
import time
from typing import Callable, Dict, List

from fastapi import Request, status

from app.core.config import settings
from app.core.exceptions import AppError


class RateLimitExceededError(AppError):
    def __init__(self, retry_after_seconds: int = 60):
        self.retry_after_seconds = retry_after_seconds
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message="Too many requests. Please wait a moment and try again.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )


class SlidingWindowRateLimiter:
    """
    Sliding-window rate limiter backed by Redis when available, with a thread-safe
    in-memory fallback for local development and tests.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._buckets: Dict[str, List[float]] = {}
        self._redis_client = None
        self._redis_unavailable_until: float = 0.0

    def _get_redis(self):
        now = time.time()
        if now < self._redis_unavailable_until:
            return None
        if self._redis_client is None:
            try:
                import redis

                client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=0.25,
                    socket_timeout=0.25,
                )
                client.ping()
                self._redis_client = client
            except Exception:
                self._redis_unavailable_until = now + 30.0
                return None
        return self._redis_client

    def check(self, key: str, limit: int, window_seconds: int = 60) -> None:
        if not settings.RATE_LIMIT_ENABLED or limit <= 0:
            return

        redis_client = self._get_redis()
        if redis_client is not None:
            try:
                bucket_key = f"rl:{key}:{int(time.time() // window_seconds)}"
                count = int(redis_client.incr(bucket_key))
                if count == 1:
                    redis_client.expire(bucket_key, window_seconds)
                if count > limit:
                    raise RateLimitExceededError(retry_after_seconds=window_seconds)
                return
            except RateLimitExceededError:
                raise
            except Exception:
                self._redis_client = None

        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = [ts for ts in self._buckets.get(key, []) if ts > cutoff]
            if len(timestamps) >= limit:
                retry_after = max(1, int(timestamps[0] + window_seconds - now))
                self._buckets[key] = timestamps
                raise RateLimitExceededError(retry_after_seconds=retry_after)
            timestamps.append(now)
            self._buckets[key] = timestamps

    def clear_memory(self) -> None:
        with self._lock:
            self._buckets.clear()


rate_limiter = SlidingWindowRateLimiter()


def make_rate_limit_dependency(scope: str, limit_getter: Callable[[], int], window_seconds: int = 60):
    """Create a FastAPI dependency enforcing per-IP rate limits on sensitive endpoints."""

    async def _rate_limit_dep(request: Request) -> None:
        client_host = request.client.host if request.client else "unknown"
        forwarded = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        client_ip = forwarded or client_host
        rate_limiter.check(
            key=f"{scope}:{client_ip}",
            limit=limit_getter(),
            window_seconds=window_seconds,
        )

    return _rate_limit_dep


rate_limit_auth = make_rate_limit_dependency(
    "auth", lambda: settings.RATE_LIMIT_AUTH_PER_MINUTE, window_seconds=60
)
rate_limit_tryon = make_rate_limit_dependency(
    "tryon", lambda: settings.RATE_LIMIT_TRYON_PER_MINUTE, window_seconds=60
)

