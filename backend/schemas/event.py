from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class EventCreate(BaseModel):
    nombre: str
    slug: Optional[str] = None
    descripcion: Optional[str] = None
    fecha: date
    lugar: str


class EventResponse(BaseModel):
    id: int
    nombre: str
    slug: Optional[str]
    descripcion: Optional[str]
    fecha: date
    lugar: str

    model_config = ConfigDict(from_attributes=True)