from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event, Checkpoint, Tag, RegistrationTag, Registration, RawRead
from schemas.read import RawReadCreate, RawReadResponse, RawReadDetailResponse

router = APIRouter(prefix="/reads", tags=["Reads"])


@router.post("", response_model=RawReadResponse)
def crear_lectura(data: RawReadCreate, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    checkpoint = db.query(Checkpoint).filter(Checkpoint.id == data.checkpoint_id).first()
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint no encontrado")

    if checkpoint.event_id != data.event_id:
        raise HTTPException(status_code=400, detail="El checkpoint no pertenece al evento")

    tag = db.query(Tag).filter(Tag.codigo == data.tag_code).first()

    tag_id = None
    registration_id = None

    if tag:
        tag_id = tag.id

        asignacion = (
            db.query(RegistrationTag)
            .join(Registration, RegistrationTag.registration_id == Registration.id)
            .filter(
                Registration.event_id == data.event_id,
                RegistrationTag.tag_id == tag.id,
                RegistrationTag.activo == True
            )
            .first()
        )

        if asignacion:
            registration_id = asignacion.registration_id

    nueva = RawRead(
        event_id=data.event_id,
        checkpoint_id=data.checkpoint_id,
        tag_id=tag_id,
        registration_id=registration_id,
        tag_code=data.tag_code,
        timestamp=data.timestamp,
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("", response_model=list[RawReadResponse])
def listar_lecturas(
    event_id: Optional[int] = None,
    checkpoint_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RawRead)

    if event_id is not None:
        query = query.filter(RawRead.event_id == event_id)

    if checkpoint_id is not None:
        query = query.filter(RawRead.checkpoint_id == checkpoint_id)

    return query.order_by(RawRead.timestamp.asc()).all()


@router.get("/{read_id}", response_model=RawReadResponse)
def obtener_lectura(read_id: int, db: Session = Depends(get_db)):
    lectura = db.query(RawRead).filter(RawRead.id == read_id).first()
    if not lectura:
        raise HTTPException(status_code=404, detail="Lectura no encontrada")
    return lectura


@router.get("/{read_id}/detail", response_model=RawReadDetailResponse)
def obtener_detalle_lectura(read_id: int, db: Session = Depends(get_db)):
    lectura = db.query(RawRead).filter(RawRead.id == read_id).first()
    if not lectura:
        raise HTTPException(status_code=404, detail="Lectura no encontrada")

    checkpoint_nombre = lectura.checkpoint.nombre if lectura.checkpoint else ""
    numero_competidor = lectura.registration.numero_competidor if lectura.registration else None

    participant_id = None
    participante_nombre = None
    participante_apellido_paterno = None

    if lectura.registration and lectura.registration.participant:
        participant_id = lectura.registration.participant.id
        participante_nombre = lectura.registration.participant.nombre
        participante_apellido_paterno = lectura.registration.participant.apellido_paterno

    return RawReadDetailResponse(
        id=lectura.id,
        event_id=lectura.event_id,
        checkpoint_id=lectura.checkpoint_id,
        checkpoint_nombre=checkpoint_nombre,
        tag_id=lectura.tag_id,
        tag_code=lectura.tag_code,
        registration_id=lectura.registration_id,
        numero_competidor=numero_competidor,
        participant_id=participant_id,
        participante_nombre=participante_nombre,
        participante_apellido_paterno=participante_apellido_paterno,
        timestamp=lectura.timestamp,
    )


@router.get("/by-event/{event_id}", response_model=list[RawReadDetailResponse])
def listar_lecturas_por_evento(event_id: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    lecturas = db.query(RawRead).filter(
        RawRead.event_id == event_id
    ).order_by(RawRead.timestamp.asc()).all()

    salida = []
    for lectura in lecturas:
        checkpoint_nombre = lectura.checkpoint.nombre if lectura.checkpoint else ""
        numero_competidor = lectura.registration.numero_competidor if lectura.registration else None

        participant_id = None
        participante_nombre = None
        participante_apellido_paterno = None

        if lectura.registration and lectura.registration.participant:
            participant_id = lectura.registration.participant.id
            participante_nombre = lectura.registration.participant.nombre
            participante_apellido_paterno = lectura.registration.participant.apellido_paterno

        salida.append(
            RawReadDetailResponse(
                id=lectura.id,
                event_id=lectura.event_id,
                checkpoint_id=lectura.checkpoint_id,
                checkpoint_nombre=checkpoint_nombre,
                tag_id=lectura.tag_id,
                tag_code=lectura.tag_code,
                registration_id=lectura.registration_id,
                numero_competidor=numero_competidor,
                participant_id=participant_id,
                participante_nombre=participante_nombre,
                participante_apellido_paterno=participante_apellido_paterno,
                timestamp=lectura.timestamp,
            )
        )

    return salida