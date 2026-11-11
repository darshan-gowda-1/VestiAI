import logging
import re
import sys

_SENSITIVE_QUERY_RE = re.compile(r"(sig|token|password|secret|access_key)=[^&\s]+", re.IGNORECASE)


def redact_sensitive_text(value: str) -> str:
    """Strip signed signatures, tokens, and secrets from any loggable string."""
    return _SENSITIVE_QUERY_RE.sub(r"\1=[REDACTED]", value)


def configure_logging(debug: bool = False) -> logging.Logger:
    """
    Configure structured application logger.
    Never log raw image payloads, tokens, signatures, or credentials.
    """
    log_level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
        stream=sys.stdout,
    )
    logger = logging.getLogger("vestiai")
    logger.setLevel(log_level)
    return logger


logger = configure_logging()
