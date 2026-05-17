from datetime import datetime, timezone
from decimal import Decimal
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
    RegistrationStatusUpdate,
)
from security import require_admin
from services.registration_helpers import calcular_edad, buscar_categoria_automatica

router = APIRouter(prefix="/registrations", tags=["Registrations"])

ACTIVE_STOCK_STATUSES = {"pending_payment", "confirmed"}
CLOSED_REGISTRATION_STATUSES = {"cancelled", "expired"}


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
        status=registro.status,
        payment_status=registro.payment_status,
        amount=registro.amount,
        currency=registro.currency,
        payment_provider=registro.payment_provider,
        payment_reference=registro.payment_reference,
        payment_preference_id=registro.payment_preference_id,
        payment_id=registro.payment_id,
        payment_checkout_url=registro.payment_checkout_url,
        payment_status_detail=registro.payment_status_detail,
        payment_expires_at=registro.payment_expires_at,
        paid_at=registro.paid_at,
        confirmed_at=registro.confirmed_at,
        cancelled_at=registro.cancelled_at,
        tag_id=tag_activo.tag.id if tag_activo else None,
        tag_codigo=tag_activo.tag.codigo if tag_activo else None,
    )


def _query_tallas_activas(db: Session, event_id: int):
    return db.query(EventShirtSize).filter(
        EventShirtSize.event_id == event_id,
        EventShirtSize.activa == True,
    )


def _talla_disponible(talla: EventShirtSize) -> bool:
    return talla.stock is None or talla.stock > 0


def _es_misma_talla_del_registro(registro_actual: Optional[Registration], event_id: int, talla: Optional[str]) -> bool:
    if not registro_actual:
        return False
    return registro_actual.event_id == event_id and registro_actual.talla_playera == talla


def resolver_talla_playera(
    data: RegistrationCreate,
    db: Session,
    registro_actual: Optional[Registration] = None,
) -> Optional[EventShirtSize]:
    tallas_activas = _query_tallas_activas(db, data.event_id).all()

    if not tallas_activas:
        return None

    tallas_disponibles = [talla for talla in tallas_activas if _talla_disponible(talla)]

    if not tallas_disponibles and not _es_misma_talla_del_registro(registro_actual, data.event_id, data.talla_playera):
        raise HTTPException(status_code=400, detail="No hay tallas de playera disponibles para este evento")

    if not data.talla_playera:
        raise HTTPException(status_code=400, detail="Selecciona una talla de playera")

    talla = _query_tallas_activas(db, data.event_id).filter(
        EventShirtSize.talla == data.talla_playera,
    ).first()

    if not talla:
        raise HTTPException(status_code=400, detail="La talla seleccionada no está activa para este evento")

    if not _talla_disponible(talla) and not _es_misma_talla_del_registro(registro_actual, data.event_id, data.talla_playera):
        raise HTTPException(status_code=400, detail="La talla seleccionada ya no tiene stock disponible")

    return talla


def reservar_talla(db: Session, event_id: int, talla_playera: Optional[str]):
    if not talla_playera:
        return

    talla = _query_tallas_activas(db, event_id).filter(EventShirtSize.talla == talla_playera).first()
    if talla and talla.stock is not None:
        talla.stock = max(talla.stock - 1, 0)


def liberar_talla(db: Session, event_id: Optional[int], talla_playera: Optional[str]):
    if not event_id or not talla_playera:
        return

    talla = db.query(EventShirtSize).filter(
        EventShirtSize.event_id == event_id,
        EventShirtSize.talla == talla_playera,
    ).first()

    if talla and talla.stock is not None:
        talla.stock += 1


def validar_y_resolver_registro(
    data: RegistrationCreate,
    db: Session,
    registro_actual: Optional[Registration] = None,
):
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

    talla = resolver_talla_playera(data, db, registro_actual)

    return evento, participante, modalidad, producto, categoria, talla


def calcular_monto_inscripcion(modalidad: EventModality, producto: Optional[RegistrationProduct]) -> Decimal:
    total = Decimal(modalidad.precio or 0)
    if producto:
        total += Decimal(producto.precio or 0)
    return total


@router.post("", response_model=RegistrationResponse)
def crear_registro(data: RegistrationCreate, db: Session = Depends(get_db)):
    evento, _, modalidad, producto, categoria, _ = validar_y_resolver_registro(data, db)

    if not evento.inscripciones_abiertas:
        raise HTTPException(status_code=400, detail="Las inscripciones de este evento están cerradas")

    existente = db.query(Registration).filter(
        Registration.event_id == data.event_id,
        Registration.participant_id == data.participant_id,
        ~Registration.status.in_(CLOSED_REGISTRATION_STATUSES),
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="El participante ya tiene una inscripción activa o pendiente en este evento")

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
        status="pending_payment",
        payment_status="unpaid",
        amount=calcular_monto_inscripcion(modalidad, producto),
        currency="MXN",
    )

    db.add(nuevo)
    db.flush()
    reservar_talla(db, data.event_id, data.talla_playera)

    if tag_obj is not None:
        db.add(RegistrationTag(registration_id=nuevo.id, tag_id=tag_obj.id, activo=True))

    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[RegistrationResponse], dependencies=[Depends(require_admin)])
def listar_registros(
    event_id: Optional[int] = None,
    participant_id: Optional[int] = None,
    modality_id: Optional[int] = None,
    talla_playera: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Registration)

    if event_id is not None:
        query = query.filter(Registration.event_id == event_id)

    if participant_id is not None:
        query = query.filter(Registration.participant_id == participant_id)

    if modality_id is not None:
        query = query.filter(Registration.modality_id == modality_id)

    if talla_playera:
        query = query.filter(Registration.talla_playera == talla_playera)

    if status:
        query = query.filter(Registration.status == status)

    if payment_status:
        query = query.filter(Registration.payment_status == payment_status)

    return query.order_by(Registration.id.desc()).all()


@router.get("/by-event/{event_id}", response_model=list[RegistrationDetailResponse], dependencies=[Depends(require_admin)])
def listar_registros_por_evento(
    event_id: int,
    talla_playera: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    query = db.query(Registration).filter(Registration.event_id == event_id)

    if talla_playera:
        query = query.filter(Registration.talla_playera == talla_playera)

    if status:
        query = query.filter(Registration.status == status)

    if payment_status:
        query = query.filter(Registration.payment_status == payment_status)

    registros = query.order_by(Registration.id.desc()).all()

    return [crear_respuesta_detalle(registro) for registro in registros]


@router.get("/{registration_id}", response_model=RegistrationDetailResponse, dependencies=[Depends(require_admin)])
def obtener_registro(registration_id: int, db: Session = Depends(get_db)):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    return crear_respuesta_detalle(registro)


@router.put("/{registration_id}", response_model=RegistrationResponse, dependencies=[Depends(require_admin)])
def actualizar_registro(registration_id: int, data: RegistrationCreate, db: Session = Depends(get_db)):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    old_event_id = registro.event_id
    old_talla = registro.talla_playera

    _, _, _, _, categoria, _ = validar_y_resolver_registro(data, db, registro_actual=registro)

    existente = db.query(Registration).filter(
        Registration.event_id == data.event_id,
        Registration.participant_id == data.participant_id,
        Registration.id != registration_id,
        ~Registration.status.in_(CLOSED_REGISTRATION_STATUSES),
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="El participante ya tiene una inscripción activa o pendiente en este evento")

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

    talla_cambio = old_event_id != data.event_id or old_talla != data.talla_playera
    if talla_cambio:
        liberar_talla(db, old_event_id, old_talla)
        reservar_talla(db, data.event_id, data.talla_playera)

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


@router.patch("/{registration_id}/status", response_model=RegistrationResponse, dependencies=[Depends(require_admin)])
def actualizar_estado_registro(
    registration_id: int,
    data: RegistrationStatusUpdate,
    db: Session = Depends(get_db),
):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    previous_status = registro.status
    new_status = data.status
    now = datetime.now(timezone.utc)

    if previous_status in ACTIVE_STOCK_STATUSES and new_status in CLOSED_REGISTRATION_STATUSES:
        liberar_talla(db, registro.event_id, registro.talla_playera)

    if previous_status in CLOSED_REGISTRATION_STATUSES and new_status in ACTIVE_STOCK_STATUSES:
        resolver_talla_playera(
            RegistrationCreate(
                event_id=registro.event_id,
                participant_id=registro.participant_id,
                modality_id=registro.modality_id,
                product_id=registro.product_id,
                category_id=registro.category_id,
                numero_competidor=registro.numero_competidor,
                talla_playera=registro.talla_playera,
            ),
            db,
            registro_actual=registro,
        )
        reservar_talla(db, registro.event_id, registro.talla_playera)

    registro.status = new_status

    if data.payment_status:
        registro.payment_status = data.payment_status

    if data.payment_provider is not None:
        registro.payment_provider = data.payment_provider

    if data.payment_reference is not None:
        registro.payment_reference = data.payment_reference

    if data.paid_at:
        registro.paid_at = data.paid_at

    if new_status == "confirmed":
        registro.confirmed_at = now
        if registro.payment_status == "unpaid":
            registro.payment_status = data.payment_status or "manual"
        if not registro.paid_at and registro.payment_status in {"paid", "manual"}:
            registro.paid_at = now

    if new_status in CLOSED_REGISTRATION_STATUSES:
        registro.cancelled_at = now

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/{registration_id}", dependencies=[Depends(require_admin)])
def eliminar_registro(registration_id: int, db: Session = Depends(get_db)):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    if registro.status in ACTIVE_STOCK_STATUSES:
        liberar_talla(db, registro.event_id, registro.talla_playera)

    db.delete(registro)
    db.commit()
    return {"message": "Inscripción eliminada correctamente"}
