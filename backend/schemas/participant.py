from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ParticipantCreate(BaseModel):
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    ciudad: Optional[str] = None
    equipo: Optional[str] = None
    contacto_emergencia: Optional[str] = None
    telefono_emergencia: Optional[str] = None


class ParticipantResponse(BaseModel):
    id: int
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str]
    fecha_nacimiento: Optional[date]
    sexo: Optional[str]
    telefono: Optional[str]
    correo: Optional[str]
    ciudad: Optional[str]
    equipo: Optional[str]
    contacto_emergencia: Optional[str]
    telefono_emergencia: Optional[str]

    model_config = ConfigDict(from_attributes=True)
