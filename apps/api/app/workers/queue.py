from collections import deque
import threading
import time
from typing import Dict, Optional, Tuple

from app.core.config import settings

QUEUE_KEY = "vestiai:tryon_queue"


class JobQueueClient:
    """
    Task queue abstraction backed by Redis when available, with a thread-safe
    in-memory fallback and idempotency/deduplication tracking.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._memory_queue: deque[str] = deque()
        self._idempotency_cache: Dict[str, Tuple[str, float]] = {}
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
                    socket_connect_timeout=0.3,
                    socket_timeout=0.3,
                )
                client.ping()
                self._redis_client = client
            except Exception:
                self._redis_unavailable_until = now + 30.0
                return None
        return self._redis_client

    def enqueue(self, job_id: str) -> str:
        redis_client = self._get_redis()
        if redis_client is not None:
            try:
                redis_client.rpush(QUEUE_KEY, job_id)
                return "redis"
            except Exception:
                self._redis_client = None

        with self._lock:
            self._memory_queue.append(job_id)
        return "memory"

    def dequeue(self, timeout_seconds: int = 0) -> Optional[str]:
        redis_client = self._get_redis()
        if redis_client is not None:
            try:
                if timeout_seconds > 0:
                    item = redis_client.blpop(QUEUE_KEY, timeout=timeout_seconds)
                    return item[1] if item else None
                return redis_client.lpop(QUEUE_KEY)
            except Exception:
                self._redis_client = None

        with self._lock:
            if self._memory_queue:
                return self._memory_queue.popleft()
        return None

    def get_idempotent_job_id(self, dedup_key: str) -> Optional[str]:
        redis_client = self._get_redis()
        if redis_client is not None:
            try:
                return redis_client.get(f"tryon_dedup:{dedup_key}")
            except Exception:
                self._redis_client = None

        now = time.time()
        with self._lock:
            entry = self._idempotency_cache.get(dedup_key)
            if entry is None:
                return None
            job_id, expires_at = entry
            if expires_at <= now:
                del self._idempotency_cache[dedup_key]
                return None
            return job_id

    def set_idempotent_job_id(self, dedup_key: str, job_id: str, ttl_seconds: int = 60) -> None:
        redis_client = self._get_redis()
        if redis_client is not None:
            try:
                redis_client.setex(f"tryon_dedup:{dedup_key}", ttl_seconds, job_id)
                return
            except Exception:
                self._redis_client = None

        with self._lock:
            self._idempotency_cache[dedup_key] = (job_id, time.time() + ttl_seconds)

    def clear_memory(self) -> None:
        with self._lock:
            self._memory_queue.clear()
            self._idempotency_cache.clear()


job_queue = JobQueueClient()

