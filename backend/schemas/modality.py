from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class EventModalityCreate(BaseModel):
    event_id: int
    nombre: str
    distancia_km: Optional[Decimal] = None


class EventModalityResponse(BaseModel):
    id: int
    event_id: int
    nombre: str
    distancia_km: Optional[Decimal]

    model_config = ConfigDict(from_attributes=True)