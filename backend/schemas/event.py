from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from schemas.category import CategoryResponse
from schemas.modality import EventModalityResponse
from schemas.product import RegistrationProductResponse
from schemas.shirt_size import EventShirtSizeResponse


class EventCreate(BaseModel):
    nombre: str
    slug: Optional[str] = None
    descripcion: Optional[str] = None
    fecha: date
    lugar: str
    hora_salida: Optional[str] = None
    organizador: Optional[str] = None
    inscripciones_abiertas: bool = True
    cuenta_regresiva_at: Optional[datetime] = None
    color_primario: Optional[str] = None
    color_secundario: Optional[str] = None
    color_acento: Optional[str] = None
    imagen_hero: Optional[str] = None
    imagen_portada: Optional[str] = None
    imagen_convocatoria: Optional[str] = None
    imagen_playera: Optional[str] = None
    imagen_medalla: Optional[str] = None
    imagen_dorsal: Optional[str] = None
    dorsal_personalizacion_enabled: bool = False
    dorsal_personalizacion_max_chars: int = Field(default=20, ge=1, le=100)
    dorsal_personalizacion_free_limit: int = Field(default=0, ge=0)
    dorsal_personalizacion_price: Decimal = Field(default=Decimal("0"), ge=0)
    dorsal_personalizacion_image: Optional[str] = None
    dorsal_personalizacion_text_color: str = "#111827"
    dorsal_personalizacion_text_top: int = Field(default=50, ge=0, le=100)
    dorsal_personalizacion_text_size: int = Field(default=36, ge=12, le=120)


class EventResponse(BaseModel):
    id: int
    nombre: str
    slug: Optional[str]
    descripcion: Optional[str]
    fecha: date
    lugar: str
    hora_salida: Optional[str] = None
    organizador: Optional[str] = None
    inscripciones_abiertas: bool = True
    cuenta_regresiva_at: Optional[datetime] = None
    color_primario: Optional[str] = None
    color_secundario: Optional[str] = None
    color_acento: Optional[str] = None
    imagen_hero: Optional[str] = None
    imagen_portada: Optional[str] = None
    imagen_convocatoria: Optional[str] = None
    imagen_playera: Optional[str] = None
    imagen_medalla: Optional[str] = None
    imagen_dorsal: Optional[str] = None
    dorsal_personalizacion_enabled: bool = False
    dorsal_personalizacion_max_chars: int = 20
    dorsal_personalizacion_free_limit: int = 0
    dorsal_personalizacion_price: Decimal = Decimal("0")
    dorsal_personalizacion_image: Optional[str] = None
    dorsal_personalizacion_text_color: str = "#111827"
    dorsal_personalizacion_text_top: int = 50
    dorsal_personalizacion_text_size: int = 36

    model_config = ConfigDict(from_attributes=True)


class EventSetupResponse(EventResponse):
    modalities: list[EventModalityResponse] = []
    categories: list[CategoryResponse] = []
    products: list[RegistrationProductResponse] = []
    shirt_sizes: list[EventShirtSizeResponse] = []


class EventKitItemCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    imagen: Optional[str] = None
    orden: int = 0
    visible: bool = True


class EventKitItemUpdate(EventKitItemCreate):
    pass


class EventKitItemResponse(EventKitItemCreate):
    id: int
    event_id: int

    model_config = ConfigDict(from_attributes=True)


class CountItem(BaseModel):
    id: Optional[int] = None
    nombre: str
    total: int


class EventStatsResponse(BaseModel):
    event_id: int
    total_inscritos: int
    por_modalidad: list[CountItem]
    por_categoria: list[CountItem]
    por_talla: list[CountItem]
    por_producto: list[CountItem]
    por_estado: list[CountItem] = []
    por_pago: list[CountItem] = []
