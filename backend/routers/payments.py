import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Optional
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Registration
from schemas.payment import (
    MercadoPagoPreferenceCreate,
    MercadoPagoPreferenceResponse,
    RegistrationPaymentStatusResponse,
)
from routers.registrations import (
    assign_competitor_number_if_needed,
    expire_registration_if_needed,
    get_public_registration_by_token,
)
from services.confirmation_email import send_registration_confirmation_email

router = APIRouter(prefix="/payments", tags=["Payments"])

MERCADO_PAGO_API_BASE = "https://api.mercadopago.com"
PAYMENT_STATUS_MAP = {
    "approved": ("confirmed", "paid"),
    "pending": ("pending_payment", "unpaid"),
    "in_process": ("pending_payment", "unpaid"),
    "authorized": ("pending_payment", "unpaid"),
    "rejected": ("pending_payment", "failed"),
    "cancelled": ("cancelled", "failed"),
    "refunded": ("cancelled", "refunded"),
    "charged_back": ("cancelled", "refunded"),
}


def _get_env(name: str, required: bool = False) -> Optional[str]:
    value = os.getenv(name)
    if value:
        value = value.strip()
    if required and not value:
        raise HTTPException(status_code=500, detail=f"Falta configurar {name}")
    return value


def _frontend_url(path: str = "") -> str:
    base_url = _get_env("FRONTEND_URL") or "http://localhost:5173"
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}"


def _is_public_https_url(value: Optional[str]) -> bool:
    if not value:
        return False

    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.netloc)


def _webhook_url() -> str:
    explicit_url = _get_env("MERCADOPAGO_WEBHOOK_URL")
    if explicit_url:
        return explicit_url

    backend_url = _get_env("BACKEND_PUBLIC_URL") or "https://sudor-time.onrender.com"
    return f"{backend_url.rstrip('/')}/payments/mercadopago/webhook"


def _access_token() -> str:
    return _get_env("MERCADOPAGO_ACCESS_TOKEN", required=True) or ""


def _to_money(value) -> Decimal:
    return Decimal(str(value or "0")).quantize(Decimal("0.01"))


def _as_utc(value: Optional[datetime]) -> Optional[datetime]:
    if not value:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _parse_mp_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def _payment_expiration_for_registration(registration: Registration) -> datetime:
    registration_expires_at = _as_utc(registration.expires_at)
    if registration_expires_at:
        return registration_expires_at
    return datetime.now(timezone.utc) + timedelta(hours=48)


def _paid_after_registration_expired(registration: Registration, paid_at: datetime) -> bool:
    expires_at = _as_utc(registration.expires_at)
    return bool(expires_at and paid_at > expires_at)


def _registration_payment_status(registration: Registration) -> RegistrationPaymentStatusResponse:
    participant = registration.participant
    participant_name = " ".join(
        part
        for part in [
            participant.nombre,
            participant.apellido_paterno,
            participant.apellido_materno,
        ]
        if part
    )

    return RegistrationPaymentStatusResponse(
        registration_id=registration.id,
        event_id=registration.event_id,
        event_nombre=registration.event.nombre,
        event_imagen_dorsal=registration.event.imagen_dorsal,
        participante_nombre=participant_name,
        modalidad_nombre=registration.modality.nombre if registration.modality else "Sin modalidad",
        producto_nombre=registration.product.nombre if registration.product else None,
        categoria_nombre=registration.category.nombre if registration.category else None,
        numero_competidor=registration.numero_competidor,
        talla_playera=registration.talla_playera,
        status=registration.status,
        payment_status=registration.payment_status,
        amount=registration.amount,
        currency=registration.currency,
        payment_provider=registration.payment_provider,
        payment_preference_id=registration.payment_preference_id,
        payment_id=registration.payment_id,
        payment_checkout_url=registration.payment_checkout_url,
        payment_status_detail=registration.payment_status_detail,
        payment_expires_at=registration.payment_expires_at,
        confirmation_email_sent=bool(registration.confirmation_email_sent_at),
        paid_at=registration.paid_at,
        confirmed_at=registration.confirmed_at,
        expires_at=registration.expires_at,
        expired_at=registration.expired_at,
    )


def _signature_parts(signature: Optional[str]) -> dict[str, str]:
    parts: dict[str, str] = {}
    if not signature:
        return parts

    for item in signature.split(","):
        key, _, value = item.partition("=")
        if key and value:
            parts[key.strip()] = value.strip()
    return parts


def _validate_webhook_signature(
    data_id: Optional[str],
    request_id: Optional[str],
    signature: Optional[str],
):
    secret = _get_env("MERCADOPAGO_WEBHOOK_SECRET")
    if not secret:
        if os.getenv("ENVIRONMENT") == "production" or os.getenv("RENDER"):
            raise HTTPException(status_code=500, detail="Falta configurar MERCADOPAGO_WEBHOOK_SECRET")
        return

    parts = _signature_parts(signature)
    timestamp = parts.get("ts")
    received_signature = parts.get("v1")
    if not timestamp or not received_signature:
        raise HTTPException(status_code=401, detail="Firma de webhook incompleta")

    template_parts = []
    if data_id:
        template_parts.append(f"id:{data_id};")
    if request_id:
        template_parts.append(f"request-id:{request_id};")
    template_parts.append(f"ts:{timestamp};")

    signed_template = "".join(template_parts)
    expected_signature = hmac.new(
        secret.encode(),
        signed_template.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, received_signature):
        raise HTTPException(status_code=401, detail="Firma de webhook inválida")


async def _mercadopago_request(method: str, path: str, **kwargs) -> dict[str, Any]:
    headers = kwargs.pop("headers", {})
    headers["Authorization"] = f"Bearer {_access_token()}"

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.request(
            method,
            f"{MERCADO_PAGO_API_BASE}{path}",
            headers=headers,
            **kwargs,
        )

    if response.status_code >= 400:
        try:
            error_data = response.json()
        except ValueError:
            error_data = {"message": response.text}

        mp_message = error_data.get("message") or error_data.get("error") or "Solicitud rechazada"
        cause = error_data.get("cause")
        if isinstance(cause, list) and cause:
            first_cause = cause[0]
            if isinstance(first_cause, dict):
                mp_message = first_cause.get("description") or first_cause.get("message") or mp_message

        raise HTTPException(
            status_code=502,
            detail=f"Mercado Pago rechazó la solicitud: {mp_message}",
        )

    return response.json()


def _build_preference_payload(registration: Registration, expires_at: datetime) -> dict[str, Any]:
    participant = registration.participant
    event = registration.event
    title = f"Inscripción {event.nombre}"

    payer: dict[str, Any] = {}
    if participant.correo:
        payer["email"] = participant.correo
    if participant.nombre:
        payer["name"] = participant.nombre
    if participant.apellido_paterno:
        payer["surname"] = " ".join(
            part for part in [participant.apellido_paterno, participant.apellido_materno] if part
        )
    access_token = registration.public_token or ""
    success_url = _frontend_url(f"inscripcion/{access_token}/pago?status=success")
    failure_url = _frontend_url(f"inscripcion/{access_token}/pago?status=failure")
    pending_url = _frontend_url(f"inscripcion/{access_token}/pago?status=pending")

    payload = {
        "items": [
            {
                "id": f"registration-{registration.id}",
                "title": title,
                "description": registration.modality.nombre if registration.modality else title,
                "quantity": 1,
                "currency_id": registration.currency or "MXN",
                "unit_price": float(_to_money(registration.amount)),
            }
        ],
        "payer": payer,
        "external_reference": str(registration.id),
        "notification_url": _webhook_url(),
        "back_urls": {
            "success": success_url,
            "failure": failure_url,
            "pending": pending_url,
        },
        "expires": True,
        "expiration_date_to": expires_at.isoformat(),
        "statement_descriptor": "SUDORTIME",
        "metadata": {
            "registration_id": registration.id,
            "event_id": registration.event_id,
        },
    }

    if _is_public_https_url(success_url):
        payload["auto_return"] = "approved"

    return payload


def _apply_payment_to_registration(db: Session, registration: Registration, payment: dict[str, Any]):
    mp_status = payment.get("status")
    status_detail = payment.get("status_detail")
    registration_status, payment_status = PAYMENT_STATUS_MAP.get(
        mp_status,
        ("pending_payment", "unpaid"),
    )

    transaction_amount = _to_money(payment.get("transaction_amount"))
    expected_amount = _to_money(registration.amount)
    currency = payment.get("currency_id") or registration.currency

    registration.payment_provider = "mercado_pago"
    registration.payment_id = str(payment.get("id") or "")
    registration.payment_reference = str(payment.get("id") or "")
    registration.payment_status_detail = status_detail

    if transaction_amount != expected_amount or currency != registration.currency:
        registration.payment_status = "failed"
        registration.payment_status_detail = "amount_or_currency_mismatch"
        return

    if payment_status == "paid":
        paid_at = _parse_mp_datetime(payment.get("date_approved")) or datetime.now(timezone.utc)
        registration.payment_status = "paid"
        registration.paid_at = paid_at

        if registration.status == "expired" or _paid_after_registration_expired(registration, paid_at):
            registration.payment_status_detail = "paid_after_registration_expired"
            if registration.status != "expired":
                registration.status = "expired"
                registration.expired_at = _as_utc(registration.expires_at) or paid_at
            return

        registration.status = "confirmed"
        assign_competitor_number_if_needed(db, registration)
        registration.confirmed_at = paid_at
        return

    if registration.status == "expired" and registration_status == "pending_payment":
        registration.payment_status = payment_status
        return

    registration.status = registration_status
    registration.payment_status = payment_status

    if registration_status == "cancelled":
        registration.cancelled_at = datetime.now(timezone.utc)


async def _find_latest_mercadopago_payment(registration: Registration) -> Optional[dict[str, Any]]:
    if not registration.payment_preference_id and not registration.payment_reference:
        return None

    try:
        search = await _mercadopago_request(
            "GET",
            "/v1/payments/search",
            params={
                "external_reference": str(registration.id),
                "sort": "date_created",
                "criteria": "desc",
            },
        )
    except HTTPException as exc:
        print(f"No se pudo reconciliar pago de registro {registration.id}: {exc.detail}")
        return None

    results = search.get("results") or []
    if not results:
        return None

    candidate = next((payment for payment in results if payment.get("status") == "approved"), results[0])
    payment_id = candidate.get("id")
    if not payment_id:
        return candidate

    try:
        return await _mercadopago_request("GET", f"/v1/payments/{payment_id}")
    except HTTPException as exc:
        print(f"No se pudo consultar pago {payment_id} de registro {registration.id}: {exc.detail}")
        return candidate


async def _reconcile_registration_payment(db: Session, registration: Registration):
    if registration.status == "confirmed" or registration.payment_status == "paid":
        return

    payment = await _find_latest_mercadopago_payment(registration)
    if not payment:
        return

    paid_at = _parse_mp_datetime(payment.get("date_approved")) or datetime.now(timezone.utc)
    expires_at = _as_utc(registration.expires_at)
    should_expire_before_apply = (
        payment.get("status") != "approved"
        or bool(expires_at and paid_at > expires_at)
    )

    if should_expire_before_apply:
        expire_registration_if_needed(db, registration)

    was_confirmed = registration.status == "confirmed"
    _apply_payment_to_registration(db, registration, payment)
    db.commit()
    db.refresh(registration)

    if (
        not was_confirmed
        and registration.status == "confirmed"
        and not registration.confirmation_email_sent_at
    ):
        try:
            if send_registration_confirmation_email(registration):
                registration.confirmation_email_sent_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(registration)
        except Exception as exc:
            print(f"No se pudo enviar correo de confirmacion para registro {registration.id}: {exc}")


@router.post("/mercadopago/create-preference", response_model=MercadoPagoPreferenceResponse)
async def crear_preferencia_mercadopago(
    data: MercadoPagoPreferenceCreate,
    db: Session = Depends(get_db),
):
    registration = get_public_registration_by_token(db, data.access_token)

    if registration.status not in {"pending_payment", "confirmed"}:
        raise HTTPException(status_code=400, detail="La inscripción no está disponible para pago")

    if registration.payment_status == "paid" or registration.status == "confirmed":
        return MercadoPagoPreferenceResponse(
            registration_id=registration.id,
            preference_id=registration.payment_preference_id or "",
            checkout_url=registration.payment_checkout_url or "",
            sandbox_checkout_url=None,
            amount=registration.amount,
            currency=registration.currency,
            expires_at=registration.payment_expires_at or datetime.now(timezone.utc),
        )

    if not registration.amount or _to_money(registration.amount) <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="La inscripción no tiene monto válido para pagar")

    expires_at = _payment_expiration_for_registration(registration)
    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="La preinscripcion ya expiro")

    payload = _build_preference_payload(registration, expires_at)
    preference = await _mercadopago_request("POST", "/checkout/preferences", json=payload)

    checkout_url = preference.get("init_point") or preference.get("sandbox_init_point")
    if not checkout_url:
        raise HTTPException(status_code=502, detail="Mercado Pago no devolvió URL de checkout")

    registration.payment_provider = "mercado_pago"
    registration.payment_preference_id = preference.get("id")
    registration.payment_reference = preference.get("id")
    registration.payment_checkout_url = checkout_url
    registration.payment_expires_at = expires_at
    registration.payment_status = "unpaid"
    db.commit()
    db.refresh(registration)

    return MercadoPagoPreferenceResponse(
        registration_id=registration.id,
        preference_id=registration.payment_preference_id,
        checkout_url=registration.payment_checkout_url,
        sandbox_checkout_url=preference.get("sandbox_init_point"),
        amount=registration.amount,
        currency=registration.currency,
        expires_at=expires_at,
    )


@router.post("/mercadopago/webhook")
async def webhook_mercadopago(
    request: Request,
    x_signature: Optional[str] = Header(default=None),
    x_request_id: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    payload = await request.json()
    query_data_id = request.query_params.get("data.id")
    payment_id = query_data_id or str(payload.get("data", {}).get("id") or payload.get("id") or "")
    notification_type = request.query_params.get("type") or payload.get("type")

    _validate_webhook_signature(payment_id, x_request_id, x_signature)

    if notification_type != "payment" or not payment_id:
        return {"status": "ignored"}

    payment = await _mercadopago_request("GET", f"/v1/payments/{payment_id}")
    external_reference = payment.get("external_reference")
    if not external_reference:
        return {"status": "ignored"}

    try:
        registration_id = int(external_reference)
    except (TypeError, ValueError):
        return {"status": "ignored"}

    registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registration:
        return {"status": "ignored"}

    paid_at = _parse_mp_datetime(payment.get("date_approved")) or datetime.now(timezone.utc)
    expires_at = _as_utc(registration.expires_at)
    should_expire_before_apply = (
        payment.get("status") != "approved"
        or bool(expires_at and paid_at > expires_at)
    )

    if should_expire_before_apply:
        expire_registration_if_needed(db, registration)

    was_confirmed = registration.status == "confirmed"
    _apply_payment_to_registration(db, registration, payment)
    db.commit()
    db.refresh(registration)

    should_send_confirmation = (
        not was_confirmed
        and registration.status == "confirmed"
        and not registration.confirmation_email_sent_at
    )
    if should_send_confirmation:
        try:
            if send_registration_confirmation_email(registration):
                registration.confirmation_email_sent_at = datetime.now(timezone.utc)
                db.commit()
        except Exception as exc:
            print(f"No se pudo enviar correo de confirmacion para registro {registration.id}: {exc}")

    return {"status": "received"}


@router.get("/registrations/{registration_id}/status", response_model=RegistrationPaymentStatusResponse)
def obtener_estado_pago_registro(registration_id: int, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=410,
        detail="La consulta publica por numero de registro fue deshabilitada. Usa el enlace privado de tu preinscripcion.",
    )


@router.get("/registrations/access/{access_token}/status", response_model=RegistrationPaymentStatusResponse)
async def obtener_estado_pago_registro_por_token(access_token: str, db: Session = Depends(get_db)):
    registration = get_public_registration_by_token(db, access_token)
    await _reconcile_registration_payment(db, registration)
    if registration.status == "confirmed" and assign_competitor_number_if_needed(db, registration):
        db.commit()
        db.refresh(registration)
    return _registration_payment_status(registration)
