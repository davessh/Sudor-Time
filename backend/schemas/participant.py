from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ParticipantCreate(BaseModel):
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[str] = None


class ParticipantResponse(BaseModel):
    id: int
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str]
    fecha_nacimiento: Optional[date]
    sexo: Optional[str]

    model_config = ConfigDict(from_attributes=True)