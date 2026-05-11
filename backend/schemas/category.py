from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator


class CategoryCreate(BaseModel):
    event_id: int
    modality_id: int
    nombre: str
    sexo: Optional[str] = None
    edad_min: Optional[int] = None
    edad_max: Optional[int] = None

    @model_validator(mode="after")
    def validar_rango_edades(self):
        if self.edad_min is not None and self.edad_min < 0:
            raise ValueError("edad_min no puede ser negativa")
        if self.edad_max is not None and self.edad_max < 0:
            raise ValueError("edad_max no puede ser negativa")
        if self.edad_min is not None and self.edad_max is not None and self.edad_min > self.edad_max:
            raise ValueError("edad_min no puede ser mayor que edad_max")
        return self


class CategoryResponse(BaseModel):
    id: int
    event_id: int
    modality_id: int
    nombre: str
    sexo: Optional[str]
    edad_min: Optional[int]
    edad_max: Optional[int]

    model_config = ConfigDict(from_attributes=True)
