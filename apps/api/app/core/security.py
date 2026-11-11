import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str | uuid.UUID,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> tuple[str, str, int]:
    """
    Create a signed JWT access token.
    Returns (encoded_jwt, jti, expires_in_seconds).
    """
    now = datetime.now(timezone.utc)
    delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = now + delta
    jti = str(uuid.uuid4())

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    token = jwt.encode(payload, settings.AUTH_SECRET_KEY, algorithm=settings.AUTH_ALGORITHM)
    return token, jti, int(delta.total_seconds())


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.AUTH_SECRET_KEY,
            algorithms=[settings.AUTH_ALGORITHM],
        )
    except JWTError:
        raise UnauthorizedError("Invalid or expired authentication token.")

    if not payload.get("sub") or not payload.get("jti"):
        raise UnauthorizedError("Malformed authentication token.")
    return payload


class TokenBlocklist:
    """
    Revoked JWT identifier (jti) store.
    Uses Redis when available and falls back safely to a thread-safe in-memory TTL store.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._memory_store: Dict[str, float] = {}
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
                # Avoid retrying Redis on every request during local dev without Redis
                self._redis_unavailable_until = now + 30.0
                return None
        return self._redis_client

    def _prune_memory(self) -> None:
        now = time.time()
        expired = [k for k, exp_ts in self._memory_store.items() if exp_ts <= now]
        for k in expired:
            del self._memory_store[k]

    def revoke(self, jti: str, exp_timestamp: int) -> None:
        ttl = max(1, int(exp_timestamp - time.time()))
        redis_client = self._get_redis()
        if redis_client is not None:
            try:
                redis_client.setex(f"revoked_jti:{jti}", ttl, "1")
                return
            except Exception:
                self._redis_client = None

        with self._lock:
            self._prune_memory()
            self._memory_store[jti] = float(exp_timestamp)

    def is_revoked(self, jti: str) -> bool:
        redis_client = self._get_redis()
        if redis_client is not None:
            try:
                return bool(redis_client.exists(f"revoked_jti:{jti}"))
            except Exception:
                self._redis_client = None

        with self._lock:
            self._prune_memory()
            exp_ts = self._memory_store.get(jti)
            return exp_ts is not None and exp_ts > time.time()

    def clear_memory(self) -> None:
        with self._lock:
            self._memory_store.clear()


token_blocklist = TokenBlocklist()
