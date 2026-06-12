from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from security import authenticate_admin_credentials

router = APIRouter(prefix="/auth", tags=["Auth"])


class AdminLoginRequest(BaseModel):
    username: str
    password: str
    verification_code: Optional[str] = None


class AdminLoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"


@router.post("/admin/login", response_model=AdminLoginResponse)
def login_admin(data: AdminLoginRequest):
    token = authenticate_admin_credentials(
        data.username,
        data.password,
        data.verification_code,
    )
    return AdminLoginResponse(token=token)
