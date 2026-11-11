import pytest

from app.core.rate_limit import rate_limiter


@pytest.fixture(autouse=True)
def clear_rate_limiter_between_tests():
    """Ensure in-memory rate-limit buckets do not leak across independent test cases."""
    rate_limiter.clear_memory()
    yield
    rate_limiter.clear_memory()

