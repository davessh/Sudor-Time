from pydantic import BaseModel, ConfigDict


class TagCreate(BaseModel):
    codigo: str


class TagResponse(BaseModel):
    id: int
    codigo: str

    model_config = ConfigDict(from_attributes=True)