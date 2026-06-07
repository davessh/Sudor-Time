from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, HttpUrl


class GalleryAlbumCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    facebook_url: HttpUrl
    imagen_portada: Optional[str] = None
    fecha: Optional[date] = None
    ubicacion: Optional[str] = None
    distancia: Optional[str] = None
    cantidad_fotos: Optional[int] = None
    visible: bool = True
    orden: int = 0


class GalleryAlbumUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    facebook_url: Optional[HttpUrl] = None
    imagen_portada: Optional[str] = None
    fecha: Optional[date] = None
    ubicacion: Optional[str] = None
    distancia: Optional[str] = None
    cantidad_fotos: Optional[int] = None
    visible: Optional[bool] = None
    orden: Optional[int] = None


class GalleryAlbumResponse(BaseModel):
    id: int
    titulo: str
    descripcion: Optional[str] = None
    facebook_url: str
    imagen_portada: Optional[str] = None
    fecha: Optional[date] = None
    ubicacion: Optional[str] = None
    distancia: Optional[str] = None
    cantidad_fotos: Optional[int] = None
    visible: bool
    orden: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
