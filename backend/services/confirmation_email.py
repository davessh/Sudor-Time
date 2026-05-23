import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from typing import Optional

from models import Registration


def _env(name: str, default: Optional[str] = None) -> Optional[str]:
    value = os.getenv(name, default)
    if value:
        value = value.strip()
    return value or None


def _format_money(value, currency: str = "MXN") -> str:
    amount = float(value or 0)
    return f"${amount:,.2f} {currency}"


def _participant_name(registration: Registration) -> str:
    participant = registration.participant
    return " ".join(
        part
        for part in [
            participant.nombre,
            participant.apellido_paterno,
            participant.apellido_materno,
        ]
        if part
    )


def _message_body(registration: Registration) -> str:
    participant = registration.participant
    event = registration.event

    return f"""Hola {participant.nombre},

Felicidades, tu inscripcion a {event.nombre} quedo confirmada.

Tu numero de corredor es: {registration.numero_competidor or "Por asignar"}

Resumen de inscripcion:
- Evento: {event.nombre}
- Corredor: {_participant_name(registration)}
- Modalidad: {registration.modality.nombre if registration.modality else "Sin modalidad"}
- Categoria: {registration.category.nombre if registration.category else "Por confirmar"}
- Paquete: {registration.product.nombre if registration.product else "Sin paquete adicional"}
- Playera: {registration.talla_playera or "No incluida"}
- Total pagado: {_format_money(registration.amount, registration.currency)}

Conserva este correo como comprobante de tu inscripcion.

Nos vemos en la salida.
SudorTime
"""


def send_registration_confirmation_email(registration: Registration) -> bool:
    recipient = _env("SMTP_TEST_RECIPIENT") or _env("CONFIRMATION_TEST_RECIPIENT") or registration.participant.correo
    if not recipient:
        return False

    host = _env("SMTP_HOST")
    from_email = _env("SMTP_FROM_EMAIL")
    if not host or not from_email:
        return False

    port = int(_env("SMTP_PORT", "587") or "587")
    username = _env("SMTP_USERNAME")
    password = _env("SMTP_PASSWORD")
    from_name = _env("SMTP_FROM_NAME", "SudorTime") or "SudorTime"
    use_tls = (_env("SMTP_USE_TLS", "true") or "true").lower() not in {"0", "false", "no"}

    message = EmailMessage()
    message["Subject"] = f"Inscripcion confirmada - {registration.event.nombre}"
    message["From"] = formataddr((from_name, from_email))
    message["To"] = recipient
    message.set_content(_message_body(registration))

    with smtplib.SMTP(host, port, timeout=20) as smtp:
        if use_tls:
            smtp.starttls()
        if username and password:
            smtp.login(username, password)
        smtp.send_message(message)

    return True
