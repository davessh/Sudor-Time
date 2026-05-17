from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event, EventModality
from schemas.modality import EventModalityCreate, EventModalityResponse
from security import require_admin

router = APIRouter(prefix="/modalities", tags=["Modalities"])


@router.post("", response_model=EventModalityResponse, dependencies=[Depends(require_admin)])
def crear_modalidad(data: EventModalityCreate, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    existente = db.query(EventModality).filter(
        EventModality.event_id == data.event_id,
        EventModality.nombre == data.nombre
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una modalidad con ese nombre en este evento")

    nueva = EventModality(**data.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("", response_model=list[EventModalityResponse])
def listar_modalidades(event_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(EventModality)

    if event_id is not None:
        query = query.filter(EventModality.event_id == event_id)

    return query.order_by(EventModality.id.asc()).all()


@router.get("/{modality_id}", response_model=EventModalityResponse)
def obtener_modalidad(modality_id: int, db: Session = Depends(get_db)):
    modalidad = db.query(EventModality).filter(EventModality.id == modality_id).first()
    if not modalidad:
        raise HTTPException(status_code=404, detail="Modalidad no encontrada")
    return modalidad


@router.put("/{modality_id}", response_model=EventModalityResponse, dependencies=[Depends(require_admin)])
def actualizar_modalidad(modality_id: int, data: EventModalityCreate, db: Session = Depends(get_db)):
    modalidad = db.query(EventModality).filter(EventModality.id == modality_id).first()
    if not modalidad:
        raise HTTPException(status_code=404, detail="Modalidad no encontrada")

    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    repetida = db.query(EventModality).filter(
        EventModality.event_id == data.event_id,
        EventModality.nombre == data.nombre,
        EventModality.id != modality_id
    ).first()

    if repetida:
        raise HTTPException(status_code=400, detail="Ya existe una modalidad con ese nombre en este evento")

    for key, value in data.model_dump().items():
        setattr(modalidad, key, value)

    db.commit()
    db.refresh(modalidad)
    return modalidad


@router.delete("/{modality_id}", dependencies=[Depends(require_admin)])
def eliminar_modalidad(modality_id: int, db: Session = Depends(get_db)):
    modalidad = db.query(EventModality).filter(EventModality.id == modality_id).first()
    if not modalidad:
        raise HTTPException(status_code=404, detail="Modalidad no encontrada")

    db.delete(modalidad)
    db.commit()
    return {"message": "Modalidad eliminada correctamente"}
