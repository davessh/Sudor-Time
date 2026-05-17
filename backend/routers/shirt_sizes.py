from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event, EventShirtSize
from schemas.shirt_size import EventShirtSizeCreate, EventShirtSizeResponse
from security import require_admin

router = APIRouter(prefix="/shirt-sizes", tags=["Shirt Sizes"])


@router.post("", response_model=EventShirtSizeResponse, dependencies=[Depends(require_admin)])
def crear_talla(data: EventShirtSizeCreate, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    existente = db.query(EventShirtSize).filter(
        EventShirtSize.event_id == data.event_id,
        EventShirtSize.talla == data.talla,
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya existe esa talla para este evento")

    nueva = EventShirtSize(**data.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("", response_model=list[EventShirtSizeResponse])
def listar_tallas(event_id: Optional[int] = None, solo_activas: bool = True, db: Session = Depends(get_db)):
    query = db.query(EventShirtSize)

    if event_id is not None:
        query = query.filter(EventShirtSize.event_id == event_id)

    if solo_activas:
        query = query.filter(EventShirtSize.activa == True)

    return query.order_by(EventShirtSize.id.asc()).all()


@router.get("/{shirt_size_id}", response_model=EventShirtSizeResponse)
def obtener_talla(shirt_size_id: int, db: Session = Depends(get_db)):
    talla = db.query(EventShirtSize).filter(EventShirtSize.id == shirt_size_id).first()
    if not talla:
        raise HTTPException(status_code=404, detail="Talla no encontrada")
    return talla


@router.put("/{shirt_size_id}", response_model=EventShirtSizeResponse, dependencies=[Depends(require_admin)])
def actualizar_talla(shirt_size_id: int, data: EventShirtSizeCreate, db: Session = Depends(get_db)):
    talla = db.query(EventShirtSize).filter(EventShirtSize.id == shirt_size_id).first()
    if not talla:
        raise HTTPException(status_code=404, detail="Talla no encontrada")

    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    repetida = db.query(EventShirtSize).filter(
        EventShirtSize.event_id == data.event_id,
        EventShirtSize.talla == data.talla,
        EventShirtSize.id != shirt_size_id,
    ).first()

    if repetida:
        raise HTTPException(status_code=400, detail="Ya existe esa talla para este evento")

    for key, value in data.model_dump().items():
        setattr(talla, key, value)

    db.commit()
    db.refresh(talla)
    return talla


@router.delete("/{shirt_size_id}", dependencies=[Depends(require_admin)])
def eliminar_talla(shirt_size_id: int, db: Session = Depends(get_db)):
    talla = db.query(EventShirtSize).filter(EventShirtSize.id == shirt_size_id).first()
    if not talla:
        raise HTTPException(status_code=404, detail="Talla no encontrada")

    db.delete(talla)
    db.commit()
    return {"message": "Talla eliminada correctamente"}
