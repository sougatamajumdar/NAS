import time
import logging

# Connects to the "nas" logger block inside settings.py
logger = logging.getLogger("nas")

class ActivityLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        try:
            response = self.get_response(request)
            duration = round((time.time() - start_time) * 1000, 2)
            
            # Extract user metadata safely from the request lifecycle
            user = getattr(request, "user", "AnonymousUser")
            
            # Format cleanly to save storage footprint inside your 5MB log rotations
            log_msg = (
                f"User: {user} | "
                f"{request.method} {request.path} | "
                f"Status: {response.status_code} | "
                f"Time: {duration}ms"
            )

            # Route logs cleanly to your file rotation based on HTTP standards
            if response.status_code >= 500:
                logger.error(log_msg)
            elif response.status_code >= 400:
                logger.warning(log_msg)
            else:
                logger.info(log_msg)

            return response

        except Exception:
            # Catches catastrophic server context failures before a response object can compile
            duration = round((time.time() - start_time) * 1000, 2)
            user = getattr(request, "user", "AnonymousUser")
            
            logger.exception(
                f"User: {user} | "
                f"{request.method} {request.path} | "
                f"UNHANDLED_EXCEPTION | "
                f"Time: {duration}ms"
            )
            raise
