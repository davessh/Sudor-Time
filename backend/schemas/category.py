from typing import Optional

from pydantic import BaseModel, ConfigDict


class CategoryCreate(BaseModel):
    event_id: int
    modality_id: int
    nombre: str
    sexo: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    event_id: int
    modality_id: int
    nombre: str
    sexo: Optional[str]

    model_config = ConfigDict(from_attributes=True)