from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event
from schemas.event import EventCreate, EventResponse

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
            Event.id != event_id
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