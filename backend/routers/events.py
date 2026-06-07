from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from config import EVENT_UPLOADS_DIR
from dependencies import get_db
from models import Event, EventModality, RegistrationProduct, Category, EventShirtSize, Registration
from schemas.event import EventCreate, EventResponse, EventStatsResponse, CountItem
from security import require_admin

router = APIRouter(prefix="/events", tags=["Events"])

UPLOADS_DIR = EVENT_UPLOADS_DIR
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _public_upload_path(filename: str) -> str:
    return f"/uploads/eventos/{filename}"


def _looks_like_allowed_image(data: bytes, extension: str) -> bool:
    if extension in {".jpg", ".jpeg"}:
        return data.startswith(b"\xff\xd8\xff")
    if extension == ".png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if extension == ".webp":
        return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return False


@router.post("", response_model=EventResponse, dependencies=[Depends(require_admin)])
def crear_evento(data: EventCreate, db: Session = Depends(get_db)):
    if data.slug:
        existente = db.query(Event).filter(Event.slug == data.slug).first()
        if existente:
            raise HTTPException(status_code=400, detail="Ya existe un evento con ese slug")

    nuevo = Event(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[EventResponse])
def listar_eventos(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.fecha.desc()).all()


@router.get("/{event_id}/setup")
def obtener_setup_evento(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    modalities = db.query(EventModality).filter(EventModality.event_id == event_id).all()
    categories = db.query(Category).filter(Category.event_id == event_id).all()
    products = db.query(RegistrationProduct).filter(RegistrationProduct.event_id == event_id).all()

    active_shirt_sizes = db.query(EventShirtSize).filter(
        EventShirtSize.event_id == event_id,
        EventShirtSize.activa == True,
    ).order_by(EventShirtSize.id.asc()).all()

    available_shirt_sizes = [
        shirt_size
        for shirt_size in active_shirt_sizes
        if shirt_size.stock is None or shirt_size.stock > 0
    ]

    return {
        "id": event.id,
        "nombre": event.nombre,
        "slug": event.slug,
        "descripcion": event.descripcion,
        "fecha": event.fecha,
        "lugar": event.lugar,
        "hora_salida": event.hora_salida,
        "organizador": event.organizador,
        "inscripciones_abiertas": event.inscripciones_abiertas,
        "imagen_portada": event.imagen_portada,
        "imagen_convocatoria": event.imagen_convocatoria,
        "imagen_playera": event.imagen_playera,
        "imagen_medalla": event.imagen_medalla,
        "has_shirt_sizes": len(active_shirt_sizes) > 0,
        "modalities": [
            {
                "id": modality.id,
                "event_id": modality.event_id,
                "nombre": modality.nombre,
                "descripcion": modality.descripcion,
                "precio": float(modality.precio or 0),
                "distancia_km": float(modality.distancia_km) if modality.distancia_km is not None else None,
                "incluye_playera": modality.incluye_playera,
            }
            for modality in modalities
        ],
        "categories": [
            {
                "id": category.id,
                "event_id": category.event_id,
                "modality_id": category.modality_id,
                "nombre": category.nombre,
                "sexo": category.sexo,
                "edad_min": category.edad_min,
                "edad_max": category.edad_max,
            }
            for category in categories
        ],
        "products": [
            {
                "id": product.id,
                "event_id": product.event_id,
                "modality_id": product.modality_id,
                "nombre": product.nombre,
                "precio": float(product.precio or 0),
                "incluye_playera": product.incluye_playera,
            }
            for product in products
        ],
        "shirt_sizes": [
            {
                "id": shirt_size.id,
                "event_id": shirt_size.event_id,
                "talla": shirt_size.talla,
                "stock": shirt_size.stock,
                "activa": shirt_size.activa,
            }
            for shirt_size in available_shirt_sizes
        ],
        "all_shirt_sizes": [
            {
                "id": shirt_size.id,
                "event_id": shirt_size.event_id,
                "talla": shirt_size.talla,
                "stock": shirt_size.stock,
                "activa": shirt_size.activa,
            }
            for shirt_size in db.query(EventShirtSize).filter(EventShirtSize.event_id == event_id).order_by(EventShirtSize.id.asc()).all()
        ],
    }


async def _guardar_imagen_evento(event_id: int, file: UploadFile, db: Session, target_attr: str, prefix: str):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Sube una imagen JPG, PNG o WEBP")

    content_type = file.content_type or ""
    if content_type and not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}-{event_id}-{uuid4().hex}{extension}"
    destination = UPLOADS_DIR / filename

    total_bytes = 0
    first_chunk = b""
    with destination.open("wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            if not first_chunk:
                first_chunk = chunk[:16]
                if not _looks_like_allowed_image(first_chunk, extension):
                    destination.unlink(missing_ok=True)
                    raise HTTPException(status_code=400, detail="El archivo no parece ser una imagen válida")

            total_bytes += len(chunk)
            if total_bytes > MAX_UPLOAD_BYTES:
                destination.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail="La imagen no debe superar 5 MB")

            buffer.write(chunk)

    setattr(evento, target_attr, _public_upload_path(filename))
    db.commit()
    db.refresh(evento)
    return evento


@router.post("/{event_id}/upload-convocatoria", response_model=EventResponse, dependencies=[Depends(require_admin)])
async def subir_convocatoria_evento(
    event_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await _guardar_imagen_evento(event_id, file, db, "imagen_convocatoria", "evento")


@router.post("/{event_id}/upload-portada", response_model=EventResponse, dependencies=[Depends(require_admin)])
async def subir_portada_evento(
    event_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await _guardar_imagen_evento(event_id, file, db, "imagen_portada", "portada")


@router.post("/{event_id}/upload-playera", response_model=EventResponse, dependencies=[Depends(require_admin)])
async def subir_playera_evento(
    event_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await _guardar_imagen_evento(event_id, file, db, "imagen_playera", "playera")


@router.post("/{event_id}/upload-medalla", response_model=EventResponse, dependencies=[Depends(require_admin)])
async def subir_medalla_evento(
    event_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await _guardar_imagen_evento(event_id, file, db, "imagen_medalla", "medalla")


@router.get("/{event_id}/stats", response_model=EventStatsResponse, dependencies=[Depends(require_admin)])
def obtener_estadisticas_evento(event_id: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    total = db.query(Registration).filter(Registration.event_id == event_id).count()

    por_modalidad = (
        db.query(EventModality.id, EventModality.nombre, func.count(Registration.id))
        .join(Registration, Registration.modality_id == EventModality.id)
        .filter(Registration.event_id == event_id)
        .group_by(EventModality.id, EventModality.nombre)
        .order_by(EventModality.id.asc())
        .all()
    )

    por_categoria = (
        db.query(Category.id, Category.nombre, func.count(Registration.id))
        .join(Registration, Registration.category_id == Category.id)
        .filter(Registration.event_id == event_id)
        .group_by(Category.id, Category.nombre)
        .order_by(Category.id.asc())
        .all()
    )

    por_producto = (
        db.query(RegistrationProduct.id, RegistrationProduct.nombre, func.count(Registration.id))
        .join(Registration, Registration.product_id == RegistrationProduct.id)
        .filter(Registration.event_id == event_id)
        .group_by(RegistrationProduct.id, RegistrationProduct.nombre)
        .order_by(RegistrationProduct.id.asc())
        .all()
    )

    por_talla = (
        db.query(Registration.talla_playera, func.count(Registration.id))
        .filter(Registration.event_id == event_id)
        .group_by(Registration.talla_playera)
        .order_by(Registration.talla_playera.asc())
        .all()
    )

    por_estado = (
        db.query(Registration.status, func.count(Registration.id))
        .filter(Registration.event_id == event_id)
        .group_by(Registration.status)
        .order_by(Registration.status.asc())
        .all()
    )

    por_pago = (
        db.query(Registration.payment_status, func.count(Registration.id))
        .filter(Registration.event_id == event_id)
        .group_by(Registration.payment_status)
        .order_by(Registration.payment_status.asc())
        .all()
    )

    return EventStatsResponse(
        event_id=event_id,
        total_inscritos=total,
        por_modalidad=[CountItem(id=row[0], nombre=row[1], total=row[2]) for row in por_modalidad],
        por_categoria=[CountItem(id=row[0], nombre=row[1], total=row[2]) for row in por_categoria],
        por_producto=[CountItem(id=row[0], nombre=row[1], total=row[2]) for row in por_producto],
        por_talla=[CountItem(id=None, nombre=row[0] or "Sin talla", total=row[1]) for row in por_talla],
        por_estado=[CountItem(id=None, nombre=row[0] or "Sin estado", total=row[1]) for row in por_estado],
        por_pago=[CountItem(id=None, nombre=row[0] or "Sin pago", total=row[1]) for row in por_pago],
    )


@router.get("/{event_id}", response_model=EventResponse)
def obtener_evento(event_id: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return evento


@router.put("/{event_id}", response_model=EventResponse, dependencies=[Depends(require_admin)])
def actualizar_evento(event_id: int, data: EventCreate, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    if data.slug:
        slug_repetido = db.query(Event).filter(
            Event.slug == data.slug,
            Event.id != event_id,
        ).first()
        if slug_repetido:
            raise HTTPException(status_code=400, detail="Ya existe otro evento con ese slug")

    for key, value in data.model_dump().items():
        setattr(evento, key, value)

    db.commit()
    db.refresh(evento)
    return evento


@router.delete("/{event_id}", dependencies=[Depends(require_admin)])
def eliminar_evento(event_id: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    db.delete(evento)
    db.commit()
    return {"message": "Evento eliminado correctamente"}
