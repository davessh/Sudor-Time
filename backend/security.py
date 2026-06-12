import hmac
import os
import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

admin_bearer = HTTPBearer(auto_error=False)
_rate_limit_buckets: dict[str, deque[float]] = defaultdict(deque)


def require_admin(credentials: HTTPAuthorizationCredentials = Depends(admin_bearer)):
    configured_token = os.getenv("ADMIN_API_TOKEN")
    if not configured_token:
        if os.getenv("RENDER") or os.getenv("ENVIRONMENT") == "production":
            raise HTTPException(status_code=500, detail="Falta configurar ADMIN_API_TOKEN")
        return True

    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Credenciales de administrador requeridas")

    if not hmac.compare_digest(credentials.credentials, configured_token):
        raise HTTPException(status_code=403, detail="Credenciales de administrador inválidas")

    return True


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def require_public_rate_limit(request: Request):
    try:
        limit = int(os.getenv("PUBLIC_RATE_LIMIT_PER_MINUTE", "20"))
    except ValueError:
        limit = 20

    limit = max(limit, 1)
    window_seconds = 60
    now = time.monotonic()
    key = f"{_client_ip(request)}:{request.url.path}"
    bucket = _rate_limit_buckets[key]

    while bucket and now - bucket[0] > window_seconds:
        bucket.popleft()

    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Espera un momento e intenta de nuevo.")

    bucket.append(now)
    return True
