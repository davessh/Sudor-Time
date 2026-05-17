from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event, Checkpoint
from schemas.checkpoint import CheckpointCreate, CheckpointResponse
from security import require_admin

router = APIRouter(prefix="/checkpoints", tags=["Checkpoints"], dependencies=[Depends(require_admin)])


@router.post("", response_model=CheckpointResponse)
def crear_checkpoint(data: CheckpointCreate, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    existente = db.query(Checkpoint).filter(
        Checkpoint.event_id == data.event_id,
        Checkpoint.nombre == data.nombre
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un checkpoint con ese nombre en el evento")

    nuevo = Checkpoint(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[CheckpointResponse])
def listar_checkpoints(event_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Checkpoint)

    if event_id is not None:
        query = query.filter(Checkpoint.event_id == event_id)

    return query.order_by(Checkpoint.id.asc()).all()


@router.get("/{checkpoint_id}", response_model=CheckpointResponse)
def obtener_checkpoint(checkpoint_id: int, db: Session = Depends(get_db)):
    checkpoint = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_id).first()
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint no encontrado")
    return checkpoint


@router.put("/{checkpoint_id}", response_model=CheckpointResponse)
def actualizar_checkpoint(checkpoint_id: int, data: CheckpointCreate, db: Session = Depends(get_db)):
    checkpoint = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_id).first()
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint no encontrado")

    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    repetido = db.query(Checkpoint).filter(
        Checkpoint.event_id == data.event_id,
        Checkpoint.nombre == data.nombre,
        Checkpoint.id != checkpoint_id
    ).first()

    if repetido:
        raise HTTPException(status_code=400, detail="Ya existe un checkpoint con ese nombre en el evento")

    for key, value in data.model_dump().items():
        setattr(checkpoint, key, value)

    db.commit()
    db.refresh(checkpoint)
    return checkpoint


@router.delete("/{checkpoint_id}")
def eliminar_checkpoint(checkpoint_id: int, db: Session = Depends(get_db)):
    checkpoint = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_id).first()
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint no encontrado")

    db.delete(checkpoint)
    db.commit()
    return {"message": "Checkpoint eliminado correctamente"}
