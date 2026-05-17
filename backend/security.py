import hmac
import os

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

admin_bearer = HTTPBearer(auto_error=False)


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
