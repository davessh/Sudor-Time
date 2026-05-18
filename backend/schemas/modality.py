from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class EventModalityCreate(BaseModel):
    event_id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal = Decimal("0.00")
    distancia_km: Optional[Decimal] = None
    incluye_playera: bool = False


class EventModalityResponse(BaseModel):
    id: int
    event_id: int
    nombre: str
    descripcion: Optional[str]
    precio: Decimal
    distancia_km: Optional[Decimal]
    incluye_playera: bool = False

    model_config = ConfigDict(from_attributes=True)
