from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ResultResponse(BaseModel):
    lugar_general: int
    lugar_rama: Optional[int]
    lugar_categoria: Optional[int]

    registration_id: int
    participant_id: int

    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str]

    sexo: Optional[str]
    numero_competidor: Optional[str]
    modalidad_nombre: str
    categoria_id: Optional[int] = None
    categoria_nombre: Optional[str]

    tag_code: str

    salida_corredor: Optional[datetime]
    meta_corredor: datetime

    tiempo_chip_ms: Optional[int]
    tiempo_chip_texto: Optional[str]

    tiempo_oficial_ms: Optional[int]
    tiempo_oficial_texto: Optional[str]


class ResultListResponse(BaseModel):
    total: int
    resultados: list[ResultResponse]


class CategoryTop3Response(BaseModel):
    categoria_id: Optional[int]
    categoria_nombre: str
    top_3: list[ResultResponse]


class OfficialSummaryResponse(BaseModel):
    total_resultados: int
    general: list[ResultResponse]
    categorias: list[CategoryTop3Response]