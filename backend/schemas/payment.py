from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class MercadoPagoPreferenceCreate(BaseModel):
    access_token: str


class MercadoPagoPreferenceResponse(BaseModel):
    registration_id: int
    preference_id: str
    checkout_url: str
    sandbox_checkout_url: Optional[str] = None
    amount: Decimal
    currency: str
    expires_at: datetime


class RegistrationPaymentStatusResponse(BaseModel):
    registration_id: int
    event_id: int
    event_nombre: str
    participante_nombre: str
    modalidad_nombre: str
    producto_nombre: Optional[str] = None
    categoria_nombre: Optional[str] = None
    numero_competidor: Optional[str] = None
    talla_playera: Optional[str] = None
    status: str
    payment_status: str
    amount: Optional[Decimal]
    currency: str
    payment_provider: Optional[str]
    payment_preference_id: Optional[str]
    payment_id: Optional[str]
    payment_checkout_url: Optional[str]
    payment_status_detail: Optional[str]
    payment_expires_at: Optional[datetime]
    confirmation_email_sent: bool = False
    paid_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    expires_at: Optional[datetime]
    expired_at: Optional[datetime]
