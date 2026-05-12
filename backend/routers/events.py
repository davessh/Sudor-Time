from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event, EventModality, RegistrationProduct, Category, EventShirtSize, Registration
from schemas.event import EventCreate, EventResponse, EventSetupResponse, EventStatsResponse, CountItem

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=EventResponse)
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

    modalities = db.query(EventModality).filter(
        EventModality.event_id == event_id
    ).all()

    categories = db.query(Category).filter(
        Category.event_id == event_id
    ).all()

    products = db.query(RegistrationProduct).filter(
        RegistrationProduct.event_id == event_id
    ).all()

    shirt_sizes = db.query(EventShirtSize).filter(
        EventShirtSize.event_id == event_id
    ).all()

    return {
        "id": event.id,
        "nombre": event.nombre,
        "slug": event.slug,
        "descripcion": event.descripcion,
        "fecha": event.fecha,
        "lugar": event.lugar,

        # Estos son los campos que ahorita te salen null
        "hora_salida": event.hora_salida,
        "organizador": event.organizador,
        "inscripciones_abiertas": event.inscripciones_abiertas,
        "imagen_convocatoria": event.imagen_convocatoria,

        "modalities": [
            {
                "id": modality.id,
                "event_id": modality.event_id,
                "nombre": modality.nombre,
                "descripcion": modality.descripcion,
                "precio": float(modality.precio or 0),
                "distancia_km": getattr(modality, "distancia_km", None),
            }
            for modality in modalities
        ],

        "categories": [
            {
                "id": category.id,
                "event_id": category.event_id,
                "modality_id": getattr(category, "modality_id", None),
                "nombre": category.nombre,
                "sexo": getattr(category, "sexo", None),
                "edad_min": getattr(category, "edad_min", None),
                "edad_max": getattr(category, "edad_max", None),
            }
            for category in categories
        ],

        "products": [
            {
                "id": product.id,
                "event_id": product.event_id,
                "nombre": product.nombre,
                "descripcion": product.descripcion,
                "precio": float(product.precio or 0),
            }
            for product in products
        ],

        "shirt_sizes": [
            {
                "id": shirt_size.id,
                "event_id": shirt_size.event_id,
                "talla": shirt_size.talla,
                "stock": getattr(shirt_size, "stock", None),
                "activa": getattr(shirt_size, "activa", True),
            }
            for shirt_size in shirt_sizes
        ],
    }

@router.get("/{event_id}/stats", response_model=EventStatsResponse)
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

    return EventStatsResponse(
        event_id=event_id,
        total_inscritos=total,
        por_modalidad=[CountItem(id=row[0], nombre=row[1], total=row[2]) for row in por_modalidad],
        por_categoria=[CountItem(id=row[0], nombre=row[1], total=row[2]) for row in por_categoria],
        por_producto=[CountItem(id=row[0], nombre=row[1], total=row[2]) for row in por_producto],
        por_talla=[CountItem(id=None, nombre=row[0] or "Sin talla", total=row[1]) for row in por_talla],
    )


@router.get("/{event_id}", response_model=EventResponse)
def obtener_evento(event_id: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return evento


@router.put("/{event_id}", response_model=EventResponse)
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


@router.delete("/{event_id}")
def eliminar_evento(event_id: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    db.delete(evento)
    db.commit()
    return {"message": "Evento eliminado correctamente"}
