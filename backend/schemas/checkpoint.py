from pydantic import BaseModel, ConfigDict


class CheckpointCreate(BaseModel):
    event_id: int
    nombre: str
    es_salida: bool = False
    es_meta: bool = False


class CheckpointResponse(BaseModel):
    id: int
    event_id: int
    nombre: str
    es_salida: bool
    es_meta: bool

    model_config = ConfigDict(from_attributes=True)