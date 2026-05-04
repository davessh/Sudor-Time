from typing import Optional

from pydantic import BaseModel, ConfigDict


class RegistrationCreate(BaseModel):
    event_id: int
    participant_id: int
    modality_id: int
    product_id: int
    category_id: Optional[int] = None
    numero_competidor: Optional[str] = None
    tag_id: Optional[int] = None


class RegistrationResponse(BaseModel):
    id: int
    event_id: int
    participant_id: int
    modality_id: int
    product_id: int
    category_id: Optional[int]
    numero_competidor: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class RegistrationDetailResponse(BaseModel):
    id: int

    event_id: int
    event_nombre: str

    participant_id: int
    participante_nombre: str
    participante_apellido_paterno: str
    participante_apellido_materno: Optional[str]

    modality_id: int
    modalidad_nombre: str

    product_id: int
    producto_nombre: str

    category_id: Optional[int]
    categoria_nombre: Optional[str]

    numero_competidor: Optional[str]

    tag_id: Optional[int]
    tag_codigo: Optional[str]