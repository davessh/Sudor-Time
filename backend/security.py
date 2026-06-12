import hmac
import base64
import hashlib
import json
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

admin_bearer = HTTPBearer(auto_error=False)
_rate_limit_buckets: dict[str, deque[float]] = defaultdict(deque)


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _admin_session_secret() -> str:
    return os.getenv("ADMIN_SESSION_SECRET") or os.getenv("ADMIN_API_TOKEN") or ""


def _admin_session_hours() -> int:
    try:
        return max(int(os.getenv("ADMIN_SESSION_HOURS", "8")), 1)
    except ValueError:
        return 8


def _sign_admin_payload(payload: str) -> str:
    secret = _admin_session_secret()
    if not secret:
        raise HTTPException(status_code=500, detail="Falta configurar ADMIN_SESSION_SECRET o ADMIN_API_TOKEN")
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()


def create_admin_session_token(username: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=_admin_session_hours())
    payload = _base64url_encode(json.dumps({
        "sub": username,
        "scope": "admin",
        "exp": int(expires_at.timestamp()),
    }, separators=(",", ":")).encode())
    signature = _sign_admin_payload(payload)
    return f"st.{payload}.{signature}"


def _is_valid_admin_session_token(token: str) -> bool:
    if not token.startswith("st."):
        return False

    try:
        _, payload, signature = token.split(".", 2)
    except ValueError:
        return False

    expected_signature = _sign_admin_payload(payload)
    if not hmac.compare_digest(signature, expected_signature):
        return False

    try:
        data = json.loads(_base64url_decode(payload))
    except (ValueError, TypeError):
        return False

    if data.get("scope") != "admin":
        return False

    expires_at = int(data.get("exp") or 0)
    return expires_at > int(datetime.now(timezone.utc).timestamp())


def _password_matches(password: str) -> bool:
    configured_hash = os.getenv("ADMIN_PASSWORD_HASH")
    configured_password = os.getenv("ADMIN_PASSWORD")

    if configured_hash:
        digest = hashlib.sha256(password.encode()).hexdigest()
        return hmac.compare_digest(digest, configured_hash.strip().lower())

    if configured_password:
        return hmac.compare_digest(password, configured_password)

    legacy_token = os.getenv("ADMIN_API_TOKEN")
    if legacy_token:
        return hmac.compare_digest(password, legacy_token)

    return False


def authenticate_admin_credentials(username: str, password: str, verification_code: str | None = None) -> str:
    configured_username = os.getenv("ADMIN_USERNAME", "admin")
    if not hmac.compare_digest((username or "").strip(), configured_username):
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    if not _password_matches(password or ""):
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    configured_code = os.getenv("ADMIN_LOGIN_CODE")
    if configured_code and not hmac.compare_digest((verification_code or "").strip(), configured_code):
        raise HTTPException(status_code=401, detail="Codigo de verificacion invalido")

    return create_admin_session_token(configured_username)


def require_admin(credentials: HTTPAuthorizationCredentials = Depends(admin_bearer)):
    configured_token = os.getenv("ADMIN_API_TOKEN")
    if not configured_token:
        if os.getenv("RENDER") or os.getenv("ENVIRONMENT") == "production":
            raise HTTPException(status_code=500, detail="Falta configurar ADMIN_API_TOKEN")
        return True

    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Credenciales de administrador requeridas")

    bearer_token = credentials.credentials
    if _is_valid_admin_session_token(bearer_token):
        return True

    if not hmac.compare_digest(bearer_token, configured_token):
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
