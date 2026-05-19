import json
import os
from datetime import datetime, timezone
from typing import Any, Optional
from urllib.parse import parse_qs

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event, Checkpoint, Tag, RegistrationTag, Registration, RawRead
from schemas.read import RawReadCreate, RawReadResponse, RawReadDetailResponse
from security import require_admin

router = APIRouter(prefix="/reads", tags=["Reads"])


def _clean_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


def _first_value(data: dict[str, Any], *keys: str) -> Optional[str]:
    normalized = {key.lower(): value for key, value in data.items()}
    for key in keys:
        value = normalized.get(key.lower())
        if isinstance(value, list):
            value = value[0] if value else None
        cleaned = _clean_text(value)
        if cleaned is not None:
            return cleaned
    return None


def _parse_timestamp(value: Optional[str]) -> datetime:
    if not value:
        return datetime.now(timezone.utc)

    cleaned = value.strip()
    try:
        numeric = float(cleaned)
        if numeric > 10_000_000_000:
            numeric = numeric / 1000
        return datetime.fromtimestamp(numeric, timezone.utc)
    except ValueError:
        pass

    try:
        return datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Timestamp no valido")


def _parse_key_value_text(text: str) -> dict[str, Any]:
    parsed = parse_qs(text, keep_blank_values=False)
    if parsed:
        return {key: values[0] for key, values in parsed.items() if values}
    return {}


def _parse_loose_text(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if not cleaned:
        return {}

    try:
        parsed_json = json.loads(cleaned)
        if isinstance(parsed_json, dict):
            return parsed_json
    except ValueError:
        pass

    key_value_data = _parse_key_value_text(cleaned)
    if key_value_data:
        return key_value_data

    separators = [",", ";", "|", "\t", "\n", " "]
    parts = [cleaned]
    for separator in separators:
        if separator in cleaned:
            parts = [part.strip() for part in cleaned.split(separator) if part.strip()]
            break

    if len(parts) >= 3:
        data = {
            "event_id": parts[0],
            "checkpoint_id": parts[1],
            "tag_code": parts[2],
        }
        if len(parts) >= 4:
            data["timestamp"] = parts[3]
        return data

    return {"tag_code": cleaned}


async def _extract_flexible_payload(request: Request) -> dict[str, Any]:
    data: dict[str, Any] = dict(request.query_params)
    content_type = (request.headers.get("content-type") or "").lower()

    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        data.update(dict(form))
        return data

    body = await request.body()
    if not body:
        return data

    text = body.decode("utf-8", errors="ignore").strip()
    if not text:
        return data

    if "application/json" in content_type:
        try:
            parsed_json = json.loads(text)
            if isinstance(parsed_json, dict):
                data.update(parsed_json)
                return data
        except ValueError:
            pass

    data.update(_parse_loose_text(text))
    return data


def _build_read_create(data: dict[str, Any]) -> RawReadCreate:
    event_id = _first_value(data, "event_id", "event", "evento", "id_evento")
    checkpoint_id = _first_value(data, "checkpoint_id", "checkpoint", "punto", "reader", "reader_id")
    tag_code = _first_value(data, "tag_code", "tag", "codigo", "uid", "epc", "rfid", "code")
    timestamp = _first_value(data, "timestamp", "time", "ts", "fecha", "datetime")

    if not event_id:
        raise HTTPException(status_code=400, detail="Falta event_id")
    if not checkpoint_id:
        raise HTTPException(status_code=400, detail="Falta checkpoint_id")
    if not tag_code:
        raise HTTPException(status_code=400, detail="Falta tag_code")

    try:
        return RawReadCreate(
            event_id=int(event_id),
            checkpoint_id=int(checkpoint_id),
            tag_code=tag_code,
            timestamp=_parse_timestamp(timestamp),
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="event_id y checkpoint_id deben ser numericos")


def _validate_ingest_token(x_rfid_token: Optional[str], data: dict[str, Any]):
    expected_token = os.getenv("RFID_INGEST_TOKEN")
    if not expected_token:
        return

    received_token = x_rfid_token or _first_value(data, "token", "api_key", "rfid_token")
    if received_token != expected_token:
        raise HTTPException(status_code=401, detail="Token RFID invalido")


def guardar_lectura(data: RawReadCreate, db: Session) -> RawRead:
    data.tag_code = data.tag_code.strip()
    if not data.tag_code:
        raise HTTPException(status_code=400, detail="tag_code no puede estar vacio")

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


@router.post("", response_model=RawReadResponse, dependencies=[Depends(require_admin)])
def crear_lectura(data: RawReadCreate, db: Session = Depends(get_db)):
    return guardar_lectura(data, db)


@router.api_route("/ingest", methods=["GET", "POST"], response_model=RawReadResponse)
async def recibir_lectura_flexible(
    request: Request,
    x_rfid_token: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    payload = await _extract_flexible_payload(request)
    _validate_ingest_token(x_rfid_token, payload)
    data = _build_read_create(payload)
    return guardar_lectura(data, db)


@router.get("", response_model=list[RawReadResponse], dependencies=[Depends(require_admin)])
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


@router.get("/{read_id}", response_model=RawReadResponse, dependencies=[Depends(require_admin)])
def obtener_lectura(read_id: int, db: Session = Depends(get_db)):
    lectura = db.query(RawRead).filter(RawRead.id == read_id).first()
    if not lectura:
        raise HTTPException(status_code=404, detail="Lectura no encontrada")
    return lectura


@router.get("/{read_id}/detail", response_model=RawReadDetailResponse, dependencies=[Depends(require_admin)])
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


@router.get("/by-event/{event_id}", response_model=list[RawReadDetailResponse], dependencies=[Depends(require_admin)])
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
