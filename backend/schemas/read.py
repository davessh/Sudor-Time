from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RawReadCreate(BaseModel):
    event_id: int
    checkpoint_id: int
    tag_code: str
    timestamp: datetime


class RawReadResponse(BaseModel):
    id: int
    event_id: int
    checkpoint_id: int
    tag_id: Optional[int]
    registration_id: Optional[int]
    tag_code: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class RawReadDetailResponse(BaseModel):
    id: int
    event_id: int
    checkpoint_id: int
    checkpoint_nombre: str

    tag_id: Optional[int]
    tag_code: str

    registration_id: Optional[int]
    numero_competidor: Optional[str]

    participant_id: Optional[int]
    participante_nombre: Optional[str]
    participante_apellido_paterno: Optional[str]

    timestamp: datetime