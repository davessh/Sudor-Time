from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegistrationCreate(BaseModel):
    event_id: int = Field(ge=1)
    participant_id: int = Field(ge=1)
    modality_id: int = Field(ge=1)
    product_id: Optional[int] = Field(default=None, ge=1)
    category_id: Optional[int] = Field(default=None, ge=1)
    numero_competidor: Optional[str] = Field(default=None, max_length=20)
    tag_id: Optional[int] = Field(default=None, ge=1)
    talla_playera: Optional[str] = Field(default=None, max_length=20)

    @field_validator("numero_competidor", "talla_playera", mode="before")
    @classmethod
    def clean_optional_text(cls, value):
        if value is None:
            return None
        cleaned = " ".join(str(value).strip().split())
        return cleaned or None

    @field_validator("numero_competidor")
    @classmethod
    def validate_competitor_number(cls, value):
        if value and not value.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Número de competidor no válido")
        return value


class RegistrationStatusUpdate(BaseModel):
    status: Literal["pending_payment", "confirmed", "cancelled", "expired"] = "pending_payment"
    payment_status: Optional[Literal["unpaid", "paid", "failed", "refunded", "manual", "untracked"]] = None
    payment_provider: Optional[str] = None
    payment_reference: Optional[str] = None
    paid_at: Optional[datetime] = None


class RegistrationResponse(BaseModel):
    id: int
    event_id: int
    participant_id: int
    modality_id: int
    product_id: Optional[int]
    category_id: Optional[int]
    numero_competidor: Optional[str]
    talla_playera: Optional[str]
    status: str
    payment_status: str
    amount: Optional[Decimal]
    currency: str
    payment_provider: Optional[str]
    payment_reference: Optional[str]
    payment_preference_id: Optional[str]
    payment_id: Optional[str]
    payment_checkout_url: Optional[str]
    payment_status_detail: Optional[str]
    payment_expires_at: Optional[datetime]
    paid_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    expires_at: Optional[datetime]
    expired_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class RegistrationDetailResponse(BaseModel):
    id: int

    event_id: int
    event_nombre: str

    participant_id: int
    participante_nombre: str
    participante_apellido_paterno: str
    participante_apellido_materno: Optional[str]
    fecha_nacimiento: Optional[date]
    edad_evento: Optional[int]
    sexo: Optional[str]
    telefono: Optional[str]
    correo: Optional[str]
    ciudad: Optional[str]
    equipo: Optional[str]
    contacto_emergencia: Optional[str]
    telefono_emergencia: Optional[str]

    modality_id: int
    modalidad_nombre: str
    modalidad_precio: Optional[Decimal]

    product_id: Optional[int]
    producto_nombre: Optional[str]

    category_id: Optional[int]
    categoria_nombre: Optional[str]

    numero_competidor: Optional[str]
    talla_playera: Optional[str]
    status: str
    payment_status: str
    amount: Optional[Decimal]
    currency: str
    payment_provider: Optional[str]
    payment_reference: Optional[str]
    payment_preference_id: Optional[str]
    payment_id: Optional[str]
    payment_checkout_url: Optional[str]
    payment_status_detail: Optional[str]
    payment_expires_at: Optional[datetime]
    paid_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    expires_at: Optional[datetime]
    expired_at: Optional[datetime]

    tag_id: Optional[int]
    tag_codigo: Optional[str]
