from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Participant
from schemas.participant import ParticipantCreate, ParticipantResponse
from security import require_admin

router = APIRouter(prefix="/participants", tags=["Participants"])


@router.post("", response_model=ParticipantResponse, dependencies=[Depends(require_admin)])
def crear_participante(data: ParticipantCreate, db: Session = Depends(get_db)):
    nuevo = Participant(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[ParticipantResponse], dependencies=[Depends(require_admin)])
def listar_participantes(db: Session = Depends(get_db)):
    return db.query(Participant).order_by(Participant.id.desc()).all()


@router.get("/{participant_id}", response_model=ParticipantResponse, dependencies=[Depends(require_admin)])
def obtener_participante(participant_id: int, db: Session = Depends(get_db)):
    participante = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participante:
        raise HTTPException(status_code=404, detail="Participante no encontrado")
    return participante


@router.put("/{participant_id}", response_model=ParticipantResponse, dependencies=[Depends(require_admin)])
def actualizar_participante(participant_id: int, data: ParticipantCreate, db: Session = Depends(get_db)):
    participante = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participante:
        raise HTTPException(status_code=404, detail="Participante no encontrado")

    for key, value in data.model_dump().items():
        setattr(participante, key, value)

    db.commit()
    db.refresh(participante)
    return participante


@router.delete("/{participant_id}", dependencies=[Depends(require_admin)])
def eliminar_participante(participant_id: int, db: Session = Depends(get_db)):
    participante = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participante:
        raise HTTPException(status_code=404, detail="Participante no encontrado")

    db.delete(participante)
    db.commit()
    return {"message": "Participante eliminado correctamente"}
