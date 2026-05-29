import logging


logger = logging.getLogger(__name__)


def log_security_event(request, user, event_type, message):
    """
    Lightweight audit log helper.
    This keeps traceability in place even before a full security center is built.
    """
    logger.info(
        "security_event type=%s user=%s ip=%s message=%s",
        event_type,
        getattr(user, "id", None),
        request.META.get("REMOTE_ADDR") if request else None,
        message,
    )


def check_rate_limit(*args, **kwargs):
    """
    Placeholder kept for compatibility with future anti-fraud rules.
    """
    return True
