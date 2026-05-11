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
    EventShirtSize,
    Registration,
    Tag,
    RegistrationTag,
)
from schemas.registration import (
    RegistrationCreate,
    RegistrationResponse,
    RegistrationDetailResponse,
)
from services.registration_helpers import calcular_edad, buscar_categoria_automatica

router = APIRouter(prefix="/registrations", tags=["Registrations"])


def obtener_tag_activo_de_registro(registro: Registration) -> Optional[RegistrationTag]:
    for rt in registro.registration_tags:
        if rt.activo:
            return rt
    return None


def crear_respuesta_detalle(registro: Registration) -> RegistrationDetailResponse:
    tag_activo = obtener_tag_activo_de_registro(registro)
    participante = registro.participant

    return RegistrationDetailResponse(
        id=registro.id,
        event_id=registro.event.id,
        event_nombre=registro.event.nombre,
        participant_id=participante.id,
        participante_nombre=participante.nombre,
        participante_apellido_paterno=participante.apellido_paterno,
        participante_apellido_materno=participante.apellido_materno,
        fecha_nacimiento=participante.fecha_nacimiento,
        edad_evento=calcular_edad(participante.fecha_nacimiento, registro.event.fecha),
        sexo=participante.sexo,
        telefono=participante.telefono,
        correo=participante.correo,
        ciudad=participante.ciudad,
        equipo=participante.equipo,
        contacto_emergencia=participante.contacto_emergencia,
        telefono_emergencia=participante.telefono_emergencia,
        modality_id=registro.modality.id,
        modalidad_nombre=registro.modality.nombre,
        modalidad_precio=registro.modality.precio,
        product_id=registro.product.id if registro.product else None,
        producto_nombre=registro.product.nombre if registro.product else None,
        category_id=registro.category.id if registro.category else None,
        categoria_nombre=registro.category.nombre if registro.category else None,
        numero_competidor=registro.numero_competidor,
        talla_playera=registro.talla_playera,
        tag_id=tag_activo.tag.id if tag_activo else None,
        tag_codigo=tag_activo.tag.codigo if tag_activo else None,
    )


def validar_y_resolver_registro(data: RegistrationCreate, db: Session):
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

    producto = None
    if data.product_id is not None:
        producto = db.query(RegistrationProduct).filter(RegistrationProduct.id == data.product_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        if producto.event_id != data.event_id:
            raise HTTPException(status_code=400, detail="El producto no pertenece al evento indicado")
        if producto.modality_id is not None and producto.modality_id != data.modality_id:
            raise HTTPException(status_code=400, detail="El producto no pertenece a la modalidad indicada")

    categoria = None
    if data.category_id is not None:
        categoria = db.query(Category).filter(Category.id == data.category_id).first()
        if not categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        if categoria.event_id != data.event_id or categoria.modality_id != data.modality_id:
            raise HTTPException(status_code=400, detail="La categoría no coincide con el evento y la modalidad")
    else:
        total_categorias = db.query(Category).filter(
            Category.event_id == data.event_id,
            Category.modality_id == data.modality_id,
        ).count()

        if total_categorias > 0:
            categoria = buscar_categoria_automatica(db, data.event_id, data.modality_id, participante, evento)
            if not categoria:
                raise HTTPException(
                    status_code=400,
                    detail="No existe una categoría configurada para la edad/sexo del participante en esa modalidad",
                )

    tallas_configuradas = db.query(EventShirtSize).filter(
        EventShirtSize.event_id == data.event_id,
        EventShirtSize.activa == True,
    ).all()

    if tallas_configuradas:
        if not data.talla_playera:
            raise HTTPException(status_code=400, detail="Selecciona una talla de playera")

        talla_valida = any(t.talla == data.talla_playera for t in tallas_configuradas)
        if not talla_valida:
            raise HTTPException(status_code=400, detail="La talla seleccionada no está disponible para este evento")

    return evento, participante, modalidad, producto, categoria


@router.post("", response_model=RegistrationResponse)
def crear_registro(data: RegistrationCreate, db: Session = Depends(get_db)):
    _, _, _, _, categoria = validar_y_resolver_registro(data, db)

    existente = db.query(Registration).filter(
        Registration.event_id == data.event_id,
        Registration.participant_id == data.participant_id,
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="El participante ya está inscrito en este evento")

    if data.numero_competidor:
        numero_repetido = db.query(Registration).filter(
            Registration.event_id == data.event_id,
            Registration.numero_competidor == data.numero_competidor,
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
        category_id=categoria.id if categoria else data.category_id,
        numero_competidor=data.numero_competidor,
        talla_playera=data.talla_playera,
    )

    db.add(nuevo)
    db.flush()

    if tag_obj is not None:
        db.add(RegistrationTag(registration_id=nuevo.id, tag_id=tag_obj.id, activo=True))

    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[RegistrationResponse])
def listar_registros(
    event_id: Optional[int] = None,
    participant_id: Optional[int] = None,
    modality_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Registration)

    if event_id is not None:
        query = query.filter(Registration.event_id == event_id)

    if participant_id is not None:
        query = query.filter(Registration.participant_id == participant_id)

    if modality_id is not None:
        query = query.filter(Registration.modality_id == modality_id)

    return query.order_by(Registration.id.desc()).all()


@router.get("/by-event/{event_id}", response_model=list[RegistrationDetailResponse])
def listar_registros_por_evento(event_id: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    registros = db.query(Registration).filter(
        Registration.event_id == event_id,
    ).order_by(Registration.id.desc()).all()

    return [crear_respuesta_detalle(registro) for registro in registros]


@router.get("/{registration_id}", response_model=RegistrationDetailResponse)
def obtener_registro(registration_id: int, db: Session = Depends(get_db)):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    return crear_respuesta_detalle(registro)


@router.put("/{registration_id}", response_model=RegistrationResponse)
def actualizar_registro(registration_id: int, data: RegistrationCreate, db: Session = Depends(get_db)):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    _, _, _, _, categoria = validar_y_resolver_registro(data, db)

    existente = db.query(Registration).filter(
        Registration.event_id == data.event_id,
        Registration.participant_id == data.participant_id,
        Registration.id != registration_id,
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="El participante ya está inscrito en este evento")

    if data.numero_competidor:
        numero_repetido = db.query(Registration).filter(
            Registration.event_id == data.event_id,
            Registration.numero_competidor == data.numero_competidor,
            Registration.id != registration_id,
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
                Registration.id != registration_id,
            )
            .first()
        )
        if asignado:
            raise HTTPException(status_code=400, detail="Ese tag ya está asignado activamente en este evento")

    registro.event_id = data.event_id
    registro.participant_id = data.participant_id
    registro.modality_id = data.modality_id
    registro.product_id = data.product_id
    registro.category_id = categoria.id if categoria else data.category_id
    registro.numero_competidor = data.numero_competidor
    registro.talla_playera = data.talla_playera

    asignaciones_activas = db.query(RegistrationTag).filter(
        RegistrationTag.registration_id == registro.id,
        RegistrationTag.activo == True,
    ).all()

    for asignacion in asignaciones_activas:
        asignacion.activo = False

    if tag_obj is not None:
        db.add(RegistrationTag(registration_id=registro.id, tag_id=tag_obj.id, activo=True))

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
