from typing import Optional

from pydantic import BaseModel, ConfigDict


class EventShirtSizeCreate(BaseModel):
    event_id: int
    talla: str
    stock: Optional[int] = None
    activa: bool = True


class EventShirtSizeResponse(BaseModel):
    id: int
    event_id: int
    talla: str
    stock: Optional[int]
    activa: bool

    model_config = ConfigDict(from_attributes=True)
