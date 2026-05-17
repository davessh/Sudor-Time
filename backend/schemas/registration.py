from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


class RegistrationCreate(BaseModel):
    event_id: int
    participant_id: int
    modality_id: int
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    numero_competidor: Optional[str] = None
    tag_id: Optional[int] = None
    talla_playera: Optional[str] = None


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
    paid_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    cancelled_at: Optional[datetime]

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
    paid_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    cancelled_at: Optional[datetime]

    tag_id: Optional[int]
    tag_codigo: Optional[str]
