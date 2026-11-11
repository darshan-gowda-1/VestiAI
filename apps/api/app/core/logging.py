import logging
import sys


def configure_logging(debug: bool = False) -> logging.Logger:
    """
    Configure structured application logger.
    Never log raw image payloads, tokens, or credentials.
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

