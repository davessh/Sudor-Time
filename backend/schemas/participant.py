from datetime import date
import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


NAME_PATTERN = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]+$")
PHONE_PATTERN = re.compile(r"^\+?[0-9\s()-]{7,20}$")


def _clean_optional_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = " ".join(value.strip().split())
    return cleaned or None


class ParticipantCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=80)
    apellido_paterno: str = Field(min_length=2, max_length=80)
    apellido_materno: Optional[str] = Field(default=None, max_length=80)
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[str] = None
    telefono: Optional[str] = Field(default=None, max_length=20)
    correo: Optional[EmailStr] = None
    ciudad: Optional[str] = Field(default=None, max_length=120)
    equipo: Optional[str] = Field(default=None, max_length=120)
    contacto_emergencia: Optional[str] = Field(default=None, max_length=120)
    telefono_emergencia: Optional[str] = Field(default=None, max_length=20)

    @field_validator(
        "nombre",
        "apellido_paterno",
        "apellido_materno",
        "ciudad",
        "equipo",
        "contacto_emergencia",
        mode="before",
    )
    @classmethod
    def clean_text(cls, value):
        return _clean_optional_text(value)

    @field_validator("nombre", "apellido_paterno", "apellido_materno", "contacto_emergencia")
    @classmethod
    def validate_names(cls, value):
        if value and not NAME_PATTERN.match(value):
            raise ValueError("Usa solo letras, espacios y signos básicos")
        return value

    @field_validator("sexo", mode="before")
    @classmethod
    def normalize_sex(cls, value):
        cleaned = _clean_optional_text(value)
        if cleaned is None:
            return None
        normalized = cleaned.lower()
        if normalized in {"m", "masculino", "hombre"}:
            return "masculino"
        if normalized in {"f", "femenino", "mujer"}:
            return "femenino"
        raise ValueError("Sexo no válido")

    @field_validator("telefono", "telefono_emergencia", mode="before")
    @classmethod
    def clean_phone(cls, value):
        cleaned = _clean_optional_text(value)
        if cleaned and not PHONE_PATTERN.match(cleaned):
            raise ValueError("Teléfono no válido")
        return cleaned


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
