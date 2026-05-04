from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import (
    Event,
    Participant,
    EventModality,
    RegistrationProduct,
    Category,
    Registration,
    Tag,
    RegistrationTag,
)
from schemas.registration import (
    RegistrationCreate,
    RegistrationResponse,
    RegistrationDetailResponse,
)

router = APIRouter(prefix="/registrations", tags=["Registrations"])


def obtener_tag_activo_de_registro(registro: Registration) -> Optional[RegistrationTag]:
    for rt in registro.registration_tags:
        if rt.activo:
            return rt
    return None


@router.post("", response_model=RegistrationResponse)
def crear_registro(data: RegistrationCreate, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    participante = db.query(Participant).filter(Participant.id == data.participant_id).first()
    if not participante:
        raise HTTPException(status_code=404, detail="Participante no encontrado")

    modalidad = db.query(EventModality).filter(EventModality.id == data.modality_id).first()
    if not modalidad:
        raise HTTPException(status_code=404, detail="Modalidad no encontrada")
    if modalidad.event_id != data.event_id:
        raise HTTPException(status_code=400, detail="La modalidad no pertenece al evento indicado")

    producto = db.query(RegistrationProduct).filter(RegistrationProduct.id == data.product_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if producto.event_id != data.event_id:
        raise HTTPException(status_code=400, detail="El producto no pertenece al evento indicado")
    if producto.modality_id is not None and producto.modality_id != data.modality_id:
        raise HTTPException(status_code=400, detail="El producto no pertenece a la modalidad indicada")

    if data.category_id is not None:
        categoria = db.query(Category).filter(Category.id == data.category_id).first()
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        if categoria.event_id != data.event_id or categoria.modality_id != data.modality_id:
            raise HTTPException(status_code=400, detail="La categoría no coincide con el evento y la modalidad")

    existente = db.query(Registration).filter(
        Registration.event_id == data.event_id,
        Registration.participant_id == data.participant_id
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="El participante ya está inscrito en este evento")

    if data.numero_competidor:
        numero_repetido = db.query(Registration).filter(
            Registration.event_id == data.event_id,
            Registration.numero_competidor == data.numero_competidor
        ).first()

        if numero_repetido:
            raise HTTPException(status_code=400, detail="Ese número de competidor ya está asignado en este evento")

    tag_obj = None
    if data.tag_id is not None:
        tag_obj = db.query(Tag).filter(Tag.id == data.tag_id).first()
        if not tag_obj:
            raise HTTPException(status_code=404, detail="Tag no encontrado")

        asignado = (
            db.query(RegistrationTag)
            .join(Registration, RegistrationTag.registration_id == Registration.id)
            .filter(
                Registration.event_id == data.event_id,
                RegistrationTag.tag_id == data.tag_id,
                RegistrationTag.activo == True
            )
            .first()
        )
        if asignado:
            raise HTTPException(status_code=400, detail="Ese tag ya está asignado activamente en este evento")

    nuevo = Registration(
        event_id=data.event_id,
        participant_id=data.participant_id,
        modality_id=data.modality_id,
        product_id=data.product_id,
        category_id=data.category_id,
        numero_competidor=data.numero_competidor,
    )

    db.add(nuevo)
    db.flush()

    if tag_obj is not None:
        nueva_asignacion = RegistrationTag(
            registration_id=nuevo.id,
            tag_id=tag_obj.id,
            activo=True
        )
        db.add(nueva_asignacion)

    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[RegistrationResponse])
def listar_registros(
    event_id: Optional[int] = None,
    participant_id: Optional[int] = None,
    modality_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Registration)

    if event_id is not None:
        query = query.filter(Registration.event_id == event_id)

    if participant_id is not None:
        query = query.filter(Registration.participant_id == participant_id)

    if modality_id is not None:
        query = query.filter(Registration.modality_id == modality_id)

    return query.order_by(Registration.id.desc()).all()


@router.get("/{registration_id}", response_model=RegistrationDetailResponse)
def obtener_registro(registration_id: int, db: Session = Depends(get_db)):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    tag_activo = obtener_tag_activo_de_registro(registro)

    return RegistrationDetailResponse(
        id=registro.id,
        event_id=registro.event.id,
        event_nombre=registro.event.nombre,
        participant_id=registro.participant.id,
        participante_nombre=registro.participant.nombre,
        participante_apellido_paterno=registro.participant.apellido_paterno,
        participante_apellido_materno=registro.participant.apellido_materno,
        modality_id=registro.modality.id,
        modalidad_nombre=registro.modality.nombre,
        product_id=registro.product.id,
        producto_nombre=registro.product.nombre,
        category_id=registro.category.id if registro.category else None,
        categoria_nombre=registro.category.nombre if registro.category else None,
        numero_competidor=registro.numero_competidor,
        tag_id=tag_activo.tag.id if tag_activo else None,
        tag_codigo=tag_activo.tag.codigo if tag_activo else None,
    )


@router.get("/by-event/{event_id}", response_model=list[RegistrationDetailResponse])
def listar_registros_por_evento(event_id: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    registros = db.query(Registration).filter(
        Registration.event_id == event_id
    ).order_by(Registration.id.desc()).all()

    salida = []
    for registro in registros:
        tag_activo = obtener_tag_activo_de_registro(registro)

        salida.append(
            RegistrationDetailResponse(
                id=registro.id,
                event_id=registro.event.id,
                event_nombre=registro.event.nombre,
                participant_id=registro.participant.id,
                participante_nombre=registro.participant.nombre,
                participante_apellido_paterno=registro.participant.apellido_paterno,
                participante_apellido_materno=registro.participant.apellido_materno,
                modality_id=registro.modality.id,
                modalidad_nombre=registro.modality.nombre,
                product_id=registro.product.id,
                producto_nombre=registro.product.nombre,
                category_id=registro.category.id if registro.category else None,
                categoria_nombre=registro.category.nombre if registro.category else None,
                numero_competidor=registro.numero_competidor,
                tag_id=tag_activo.tag.id if tag_activo else None,
                tag_codigo=tag_activo.tag.codigo if tag_activo else None,
            )
        )

    return salida


@router.put("/{registration_id}", response_model=RegistrationResponse)
def actualizar_registro(registration_id: int, data: RegistrationCreate, db: Session = Depends(get_db)):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    participante = db.query(Participant).filter(Participant.id == data.participant_id).first()
    if not participante:
        raise HTTPException(status_code=404, detail="Participante no encontrado")

    modalidad = db.query(EventModality).filter(EventModality.id == data.modality_id).first()
    if not modalidad:
        raise HTTPException(status_code=404, detail="Modalidad no encontrada")
    if modalidad.event_id != data.event_id:
        raise HTTPException(status_code=400, detail="La modalidad no pertenece al evento indicado")

    producto = db.query(RegistrationProduct).filter(RegistrationProduct.id == data.product_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if producto.event_id != data.event_id:
        raise HTTPException(status_code=400, detail="El producto no pertenece al evento indicado")
    if producto.modality_id is not None and producto.modality_id != data.modality_id:
        raise HTTPException(status_code=400, detail="El producto no pertenece a la modalidad indicada")

    if data.category_id is not None:
        categoria = db.query(Category).filter(Category.id == data.category_id).first()
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        if categoria.event_id != data.event_id or categoria.modality_id != data.modality_id:
            raise HTTPException(status_code=400, detail="La categoría no coincide con el evento y la modalidad")

    existente = db.query(Registration).filter(
        Registration.event_id == data.event_id,
        Registration.participant_id == data.participant_id,
        Registration.id != registration_id
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="El participante ya está inscrito en este evento")

    if data.numero_competidor:
        numero_repetido = db.query(Registration).filter(
            Registration.event_id == data.event_id,
            Registration.numero_competidor == data.numero_competidor,
            Registration.id != registration_id
        ).first()

        if numero_repetido:
            raise HTTPException(status_code=400, detail="Ese número de competidor ya está asignado en este evento")

    tag_obj = None
    if data.tag_id is not None:
        tag_obj = db.query(Tag).filter(Tag.id == data.tag_id).first()
        if not tag_obj:
            raise HTTPException(status_code=404, detail="Tag no encontrado")

        asignado = (
            db.query(RegistrationTag)
            .join(Registration, RegistrationTag.registration_id == Registration.id)
            .filter(
                Registration.event_id == data.event_id,
                RegistrationTag.tag_id == data.tag_id,
                RegistrationTag.activo == True,
                Registration.id != registration_id
            )
            .first()
        )
        if asignado:
            raise HTTPException(status_code=400, detail="Ese tag ya está asignado activamente en este evento")

    registro.event_id = data.event_id
    registro.participant_id = data.participant_id
    registro.modality_id = data.modality_id
    registro.product_id = data.product_id
    registro.category_id = data.category_id
    registro.numero_competidor = data.numero_competidor

    asignaciones_activas = (
        db.query(RegistrationTag)
        .filter(
            RegistrationTag.registration_id == registro.id,
            RegistrationTag.activo == True
        )
        .all()
    )

    for asignacion in asignaciones_activas:
        asignacion.activo = False

    if tag_obj is not None:
        nueva_asignacion = RegistrationTag(
            registration_id=registro.id,
            tag_id=tag_obj.id,
            activo=True
        )
        db.add(nueva_asignacion)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{registration_id}")
def eliminar_registro(registration_id: int, db: Session = Depends(get_db)):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    db.delete(registro)
    db.commit()
    return {"message": "Inscripción eliminada correctamente"}