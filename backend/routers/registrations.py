import csv
import io
import os
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
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
    RegistrationPublicCreate,
    RegistrationResponse,
    RegistrationDetailResponse,
    RegistrationPublicLookupResponse,
    RegistrationStatusUpdate,
)
from security import require_admin
from services.confirmation_email import send_registration_confirmation_email
from services.registration_helpers import calcular_edad, buscar_categoria_automatica

router = APIRouter(prefix="/registrations", tags=["Registrations"])

ACTIVE_STOCK_STATUSES = {"pending_payment", "confirmed"}
CLOSED_REGISTRATION_STATUSES = {"cancelled", "expired"}
DEFAULT_REGISTRATION_EXPIRATION_HOURS = 48
PUBLIC_TOKEN_BYTES = 32
COMPETITOR_NUMBER_WIDTH = 3


def _normalize_email(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    cleaned = value.strip().lower()
    return cleaned or None


def _normalize_phone(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    digits = "".join(character for character in value if character.isdigit())
    return digits or None


def get_registration_expiration_hours() -> int:
    try:
        hours = int(os.getenv("REGISTRATION_EXPIRATION_HOURS", DEFAULT_REGISTRATION_EXPIRATION_HOURS))
    except ValueError:
        hours = DEFAULT_REGISTRATION_EXPIRATION_HOURS

    return max(hours, 1)


def get_registration_expiration_date() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=get_registration_expiration_hours())


def format_competitor_number(value: int) -> str:
    return str(value).zfill(COMPETITOR_NUMBER_WIDTH)


def _parse_competitor_number(value: Optional[str]) -> Optional[int]:
    if not value:
        return None
    cleaned = value.strip()
    if not cleaned.isdigit():
        return None
    return int(cleaned)


def assign_competitor_number_if_needed(db: Session, registro: Registration) -> bool:
    if registro.numero_competidor:
        return False

    db.query(Event).filter(Event.id == registro.event_id).with_for_update().first()
    existing_numbers = (
        db.query(Registration.numero_competidor)
        .filter(
            Registration.event_id == registro.event_id,
            Registration.numero_competidor.isnot(None),
        )
        .all()
    )

    highest_number = 0
    for (numero_competidor,) in existing_numbers:
        parsed_number = _parse_competitor_number(numero_competidor)
        if parsed_number and parsed_number > highest_number:
            highest_number = parsed_number

    registro.numero_competidor = format_competitor_number(highest_number + 1)
    return True


def generate_public_token(db: Session) -> str:
    while True:
        token = secrets.token_urlsafe(PUBLIC_TOKEN_BYTES)
        exists = db.query(Registration.id).filter(Registration.public_token == token).first()
        if not exists:
            return token


def get_public_registration_by_token(db: Session, access_token: str) -> Registration:
    token = (access_token or "").strip()
    if not token:
        raise HTTPException(status_code=404, detail="Enlace de inscripcion no valido")

    registro = db.query(Registration).filter(Registration.public_token == token).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Enlace de inscripcion no valido")

    if expire_registration_if_needed(db, registro):
        db.commit()
        db.refresh(registro)

    return registro


def expire_registration_if_needed(db: Session, registro: Registration, now: Optional[datetime] = None) -> bool:
    if registro.status != "pending_payment" or not registro.expires_at:
        return False

    current_time = now or datetime.now(timezone.utc)
    expires_at = registro.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at > current_time:
        return False

    liberar_talla(db, registro.event_id, registro.talla_playera)
    registro.status = "expired"
    registro.payment_status = "unpaid"
    registro.expired_at = current_time
    return True


def expire_pending_registrations(db: Session, event_id: Optional[int] = None) -> int:
    now = datetime.now(timezone.utc)
    query = db.query(Registration).filter(
        Registration.status == "pending_payment",
        Registration.expires_at.isnot(None),
        Registration.expires_at <= now,
    )

    if event_id is not None:
        query = query.filter(Registration.event_id == event_id)

    expired_count = 0
    for registro in query.all():
        if expire_registration_if_needed(db, registro, now):
            expired_count += 1

    if expired_count:
        db.commit()

    return expired_count


def obtener_tag_activo_de_registro(registro: Registration) -> Optional[RegistrationTag]:
    for rt in registro.registration_tags:
        if rt.activo:
            return rt
    return None


def buscar_registro_activo_duplicado(
    db: Session,
    event_id: int,
    participant_id: Optional[int] = None,
    correo: Optional[str] = None,
    telefono: Optional[str] = None,
    exclude_registration_id: Optional[int] = None,
) -> Optional[Registration]:
    normalized_email = _normalize_email(correo)
    normalized_phone = _normalize_phone(telefono)

    query = db.query(Registration).filter(
        Registration.event_id == event_id,
        ~Registration.status.in_(CLOSED_REGISTRATION_STATUSES),
    )

    if exclude_registration_id is not None:
        query = query.filter(Registration.id != exclude_registration_id)

    for registro in query.all():
        participante = registro.participant

        if participant_id is not None and registro.participant_id == participant_id:
            return registro

        if normalized_email and _normalize_email(participante.correo) == normalized_email:
            return registro

        if normalized_phone and _normalize_phone(participante.telefono) == normalized_phone:
            return registro

    return None


def validar_registro_duplicado(
    db: Session,
    event_id: int,
    participante: Participant,
    exclude_registration_id: Optional[int] = None,
):
    duplicado = buscar_registro_activo_duplicado(
        db,
        event_id,
        participant_id=participante.id,
        correo=participante.correo,
        telefono=participante.telefono,
        exclude_registration_id=exclude_registration_id,
    )

    if duplicado:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una inscripcion activa o pendiente para este corredor en este evento",
        )


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
        expires_at=registro.expires_at,
        expired_at=registro.expired_at,
        tag_id=tag_activo.tag.id if tag_activo else None,
        tag_codigo=tag_activo.tag.codigo if tag_activo else None,
    )


def crear_respuesta_publica(registro: Registration) -> RegistrationPublicLookupResponse:
    participante = registro.participant
    participante_nombre = " ".join(
        part
        for part in [
            participante.nombre,
            participante.apellido_paterno,
            participante.apellido_materno,
        ]
        if part
    )

    return RegistrationPublicLookupResponse(
        id=registro.id,
        event_id=registro.event_id,
        event_nombre=registro.event.nombre,
        participante_nombre=participante_nombre,
        modalidad_nombre=registro.modality.nombre if registro.modality else "Sin modalidad",
        producto_nombre=registro.product.nombre if registro.product else None,
        categoria_nombre=registro.category.nombre if registro.category else None,
        numero_competidor=registro.numero_competidor,
        talla_playera=registro.talla_playera,
        status=registro.status,
        payment_status=registro.payment_status,
        amount=registro.amount,
        currency=registro.currency,
        expires_at=registro.expires_at,
        expired_at=registro.expired_at,
        paid_at=registro.paid_at,
        confirmed_at=registro.confirmed_at,
    )


def _registration_search_text(registro: Registration) -> str:
    participante = registro.participant
    values = [
        participante.nombre,
        participante.apellido_paterno,
        participante.apellido_materno,
        participante.correo,
        participante.telefono,
        registro.numero_competidor,
        registro.modality.nombre if registro.modality else None,
        registro.category.nombre if registro.category else None,
        registro.product.nombre if registro.product else None,
        registro.talla_playera,
        str(registro.id),
    ]
    return " ".join(str(value).lower() for value in values if value)


def _format_csv_datetime(value: Optional[datetime]) -> str:
    if not value:
        return ""
    return value.isoformat()


def _format_csv_decimal(value: Optional[Decimal]) -> str:
    if value is None:
        return ""
    return str(value)


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


def requiere_talla_playera(modalidad: EventModality, producto: Optional[RegistrationProduct]) -> bool:
    return bool(modalidad.incluye_playera or (producto and producto.incluye_playera))


def reservar_talla(db: Session, event_id: int, talla_playera: Optional[str]):
    if not talla_playera:
        return

    talla = _query_tallas_activas(db, event_id).filter(
        EventShirtSize.talla == talla_playera,
    ).with_for_update().first()

    if talla and talla.stock is not None:
        if talla.stock <= 0:
            raise HTTPException(status_code=400, detail="La talla seleccionada ya no tiene stock disponible")
        talla.stock -= 1


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

    talla = resolver_talla_playera(data, db, registro_actual) if requiere_talla_playera(modalidad, producto) else None

    return evento, participante, modalidad, producto, categoria, talla


def calcular_monto_inscripcion(modalidad: EventModality, producto: Optional[RegistrationProduct]) -> Decimal:
    total = Decimal(modalidad.precio or 0)
    if producto:
        total += Decimal(producto.precio or 0)
    return total


def crear_registro_en_db(data: RegistrationCreate, db: Session) -> Registration:
    evento, participante, modalidad, producto, categoria, talla = validar_y_resolver_registro(data, db)

    if not evento.inscripciones_abiertas:
        raise HTTPException(status_code=400, detail="Las inscripciones de este evento están cerradas")

    validar_registro_duplicado(db, data.event_id, participante)

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
        talla_playera=talla.talla if talla else None,
        status="pending_payment",
        payment_status="unpaid",
        amount=calcular_monto_inscripcion(modalidad, producto),
        currency="MXN",
        public_token=generate_public_token(db),
        expires_at=get_registration_expiration_date(),
    )

    db.add(nuevo)
    db.flush()
    reservar_talla(db, data.event_id, talla.talla if talla else None)

    if tag_obj is not None:
        db.add(RegistrationTag(registration_id=nuevo.id, tag_id=tag_obj.id, activo=True))

    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.post("", response_model=RegistrationResponse)
def crear_registro(data: RegistrationCreate, db: Session = Depends(get_db)):
    return crear_registro_en_db(data, db)


@router.post("/public", response_model=RegistrationResponse)
def crear_registro_publico(data: RegistrationPublicCreate, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    if not evento.inscripciones_abiertas:
        raise HTTPException(status_code=400, detail="Las inscripciones de este evento estan cerradas")

    if not data.participant.correo and not data.participant.telefono:
        raise HTTPException(status_code=400, detail="Captura correo o telefono para validar la inscripcion")

    duplicado = buscar_registro_activo_duplicado(
        db,
        data.event_id,
        correo=data.participant.correo,
        telefono=data.participant.telefono,
    )
    if duplicado:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una inscripcion activa o pendiente para este corredor en este evento",
        )

    participante = Participant(**data.participant.model_dump())
    db.add(participante)
    db.flush()

    registration_data = RegistrationCreate(
        event_id=data.event_id,
        participant_id=participante.id,
        modality_id=data.modality_id,
        product_id=data.product_id,
        category_id=data.category_id,
        talla_playera=data.talla_playera,
    )

    return crear_registro_en_db(registration_data, db)


@router.put("/public/{access_token}", response_model=RegistrationResponse)
def actualizar_registro_publico(
    access_token: str,
    data: RegistrationPublicCreate,
    db: Session = Depends(get_db),
):
    registro = get_public_registration_by_token(db, access_token)

    if registro.status != "pending_payment" or registro.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Solo puedes editar preinscripciones pendientes de pago")

    if registro.event_id != data.event_id:
        raise HTTPException(status_code=400, detail="La preinscripcion no pertenece a este evento")

    old_event_id = registro.event_id
    old_talla = registro.talla_playera
    participante = registro.participant

    for key, value in data.participant.model_dump().items():
        setattr(participante, key, value)

    registration_data = RegistrationCreate(
        event_id=data.event_id,
        participant_id=participante.id,
        modality_id=data.modality_id,
        product_id=data.product_id,
        category_id=data.category_id,
        talla_playera=data.talla_playera,
    )

    _, _, modalidad, producto, categoria, talla = validar_y_resolver_registro(
        registration_data,
        db,
        registro_actual=registro,
    )

    validar_registro_duplicado(
        db,
        data.event_id,
        participante,
        exclude_registration_id=registro.id,
    )

    nueva_talla = talla.talla if talla else None
    if old_event_id != data.event_id or old_talla != nueva_talla:
        liberar_talla(db, old_event_id, old_talla)
        reservar_talla(db, data.event_id, nueva_talla)

    registro.modality_id = data.modality_id
    registro.product_id = data.product_id
    registro.category_id = categoria.id if categoria else data.category_id
    registro.talla_playera = nueva_talla
    registro.amount = calcular_monto_inscripcion(modalidad, producto)
    registro.payment_provider = None
    registro.payment_reference = None
    registro.payment_preference_id = None
    registro.payment_checkout_url = None
    registro.payment_expires_at = None
    registro.payment_status_detail = None

    db.commit()
    db.refresh(registro)
    return registro


@router.get("/public/search", response_model=list[RegistrationPublicLookupResponse])
def buscar_registro_publico(
    q: str,
    event_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    raise HTTPException(
        status_code=410,
        detail="La consulta publica por datos personales fue deshabilitada. Usa el enlace privado de tu preinscripcion.",
    )

    query_text = " ".join(q.strip().split())
    normalized_phone = _normalize_phone(query_text)

    if len(query_text) < 3 and not normalized_phone:
        raise HTTPException(status_code=400, detail="Ingresa correo, telefono o numero")

    expire_pending_registrations(db, event_id=event_id)

    normalized_email = _normalize_email(query_text)
    registration_id = int(normalized_phone) if normalized_phone and len(normalized_phone) <= 9 and "@" not in query_text else None

    base_query = db.query(Registration)
    if event_id is not None:
        base_query = base_query.filter(Registration.event_id == event_id)

    resultados: list[Registration] = []

    if registration_id is not None:
        registro = base_query.filter(Registration.id == registration_id).first()
        if registro:
            resultados.append(registro)

        number_matches = base_query.filter(Registration.numero_competidor == normalized_phone).all()
        resultados.extend(number_matches)

    if "@" in query_text:
        email_matches = (
            base_query
            .join(Participant, Registration.participant_id == Participant.id)
            .filter(Participant.correo.isnot(None))
            .all()
        )
        resultados.extend(
            registro
            for registro in email_matches
            if _normalize_email(registro.participant.correo) == normalized_email
        )

    if normalized_phone and len(normalized_phone) >= 7:
        phone_matches = base_query.join(Participant, Registration.participant_id == Participant.id).all()
        resultados.extend(
            registro
            for registro in phone_matches
            if _normalize_phone(registro.participant.telefono) == normalized_phone
        )

    unique_results = []
    seen_ids = set()
    for registro in sorted(resultados, key=lambda item: item.id, reverse=True):
        if registro.id in seen_ids:
            continue
        seen_ids.add(registro.id)
        unique_results.append(registro)

    return [crear_respuesta_publica(registro) for registro in unique_results[:10]]


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
    expire_pending_registrations(db, event_id=event_id)
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
    expire_pending_registrations(db, event_id=event_id)
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


@router.get("/by-event/{event_id}/export.csv", dependencies=[Depends(require_admin)])
def exportar_registros_por_evento_csv(
    event_id: int,
    talla_playera: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    modality_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    expire_pending_registrations(db, event_id=event_id)
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    query = db.query(Registration).filter(Registration.event_id == event_id)

    if modality_id is not None:
        query = query.filter(Registration.modality_id == modality_id)

    if talla_playera:
        if talla_playera == "Sin talla":
            query = query.filter(Registration.talla_playera.is_(None))
        else:
            query = query.filter(Registration.talla_playera == talla_playera)

    if status:
        query = query.filter(Registration.status == status)

    if payment_status:
        query = query.filter(Registration.payment_status == payment_status)

    registros = query.order_by(Registration.id.asc()).all()

    if search:
        search_text = search.strip().lower()
        registros = [
            registro
            for registro in registros
            if search_text in _registration_search_text(registro)
        ]

    output = io.StringIO()
    output.write("\ufeff")
    output.write("sep=,\r\n")
    writer = csv.writer(output, lineterminator="\r\n")

    writer.writerow([
        "Registro",
        "Evento",
        "Fecha evento",
        "Nombre",
        "Apellido paterno",
        "Apellido materno",
        "Sexo",
        "Edad evento",
        "Telefono",
        "Correo",
        "Ciudad",
        "Equipo",
        "Modalidad",
        "Categoria",
        "Paquete",
        "Talla",
        "Estado inscripcion",
        "Estado pago",
        "Monto",
        "Moneda",
        "Numero competidor",
        "Tag",
        "Vence pago",
        "Pagado en",
        "Confirmado en",
        "Creado en",
    ])

    for registro in registros:
        participante = registro.participant
        writer.writerow([
            registro.id,
            registro.event.nombre,
            registro.event.fecha.isoformat() if registro.event.fecha else "",
            participante.nombre,
            participante.apellido_paterno,
            participante.apellido_materno or "",
            participante.sexo or "",
            calcular_edad(participante.fecha_nacimiento, registro.event.fecha) or "",
            participante.telefono or "",
            participante.correo or "",
            participante.ciudad or "",
            participante.equipo or "",
            registro.modality.nombre if registro.modality else "",
            registro.category.nombre if registro.category else "",
            registro.product.nombre if registro.product else "",
            registro.talla_playera or "",
            registro.status,
            registro.payment_status,
            _format_csv_decimal(registro.amount),
            registro.currency or "",
            registro.numero_competidor or "",
            obtener_tag_activo_de_registro(registro).tag.codigo if obtener_tag_activo_de_registro(registro) else "",
            _format_csv_datetime(registro.expires_at),
            _format_csv_datetime(registro.paid_at),
            _format_csv_datetime(registro.confirmed_at),
            _format_csv_datetime(registro.created_at),
        ])

    filename = f"inscritos-evento-{event_id}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{registration_id}", response_model=RegistrationDetailResponse, dependencies=[Depends(require_admin)])
def obtener_registro(registration_id: int, db: Session = Depends(get_db)):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    if expire_registration_if_needed(db, registro):
        db.commit()
        db.refresh(registro)

    return crear_respuesta_detalle(registro)


@router.put("/{registration_id}", response_model=RegistrationResponse, dependencies=[Depends(require_admin)])
def actualizar_registro(registration_id: int, data: RegistrationCreate, db: Session = Depends(get_db)):
    registro = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    old_event_id = registro.event_id
    old_talla = registro.talla_playera

    _, _, _, _, categoria, talla = validar_y_resolver_registro(data, db, registro_actual=registro)
    nueva_talla = talla.talla if talla else None

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

    talla_cambio = old_event_id != data.event_id or old_talla != nueva_talla
    if talla_cambio:
        liberar_talla(db, old_event_id, old_talla)
        reservar_talla(db, data.event_id, nueva_talla)

    registro.event_id = data.event_id
    registro.participant_id = data.participant_id
    registro.modality_id = data.modality_id
    registro.product_id = data.product_id
    registro.category_id = categoria.id if categoria else data.category_id
    registro.numero_competidor = data.numero_competidor
    registro.talla_playera = nueva_talla

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
        if requiere_talla_playera(registro.modality, registro.product):
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
        assign_competitor_number_if_needed(db, registro)
        registro.confirmed_at = now
        registro.expired_at = None
        if registro.payment_status == "unpaid":
            registro.payment_status = data.payment_status or "manual"
        if not registro.paid_at and registro.payment_status in {"paid", "manual"}:
            registro.paid_at = now

    if new_status in CLOSED_REGISTRATION_STATUSES:
        if new_status == "expired":
            registro.expired_at = now
        else:
            registro.cancelled_at = now

    db.commit()
    db.refresh(registro)

    if previous_status != "confirmed" and registro.status == "confirmed" and not registro.confirmation_email_sent_at:
        try:
            if send_registration_confirmation_email(registro):
                registro.confirmation_email_sent_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(registro)
        except Exception as exc:
            print(f"No se pudo enviar correo de confirmacion para registro {registro.id}: {exc}")

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


@router.post("/expire-pending", dependencies=[Depends(require_admin)])
def expirar_registros_pendientes(event_id: Optional[int] = None, db: Session = Depends(get_db)):
    expired_count = expire_pending_registrations(db, event_id=event_id)
    return {"expired": expired_count}
