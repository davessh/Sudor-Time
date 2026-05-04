from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RegistrationProductCreate(BaseModel):
    event_id: int
    modality_id: Optional[int] = None
    nombre: str
    precio: Decimal


class RegistrationProductResponse(BaseModel):
    id: int
    event_id: int
    modality_id: Optional[int]
    nombre: str
    precio: Decimal

    model_config = ConfigDict(from_attributes=True)