import logging


logger = logging.getLogger(__name__)


def send_notification(user, title, message, notif_type="SYSTEM", reference_id=None):
    """
    Lightweight notification hook.
    A real notification model/channel can plug in here later without changing business views.
    """
    logger.info(
        "notification user=%s type=%s ref=%s title=%s message=%s",
        getattr(user, "id", None),
        notif_type,
        reference_id,
        title,
        message,
    )
    return {
        "user_id": getattr(user, "id", None),
        "type": notif_type,
        "reference_id": reference_id,
        "title": title,
        "message": message,
    }
