# Checklist Para Primera Prueba En Evento Real

## Antes De Abrir Inscripciones

- Confirmar que el backend de Render tenga `DATABASE_URL`, `ADMIN_API_TOKEN`, `FRONTEND_URL`, `CORS_ORIGINS`, `BACKEND_PUBLIC_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_WEBHOOK_URL`, `REGISTRATION_EXPIRATION_HOURS`, `UPLOADS_DIR`, `RFID_INGEST_TOKEN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` y `SMTP_USE_TLS`.
- Confirmar que el frontend tenga `VITE_API_BASE_URL` apuntando al backend real.
- Crear o revisar el evento, modalidades, precios, categorias, tallas, playera, medalla y convocatoria.
- Hacer una inscripcion de prueba desde celular y otra desde computadora.
- Probar pago en Mercado Pago y confirmar que el webhook cambie la inscripcion a `confirmed`.
- Confirmar que el corredor reciba correo con su numero de competidor.
- Probar una preinscripcion vencida y confirmar que no se pueda pagar.
- Exportar CSV de inscritos y abrirlo antes del evento.

## Dia Del Evento

- Tener una persona responsable del panel admin y una persona responsable de pagos/inscripciones.
- Exportar CSV antes de iniciar entrega de kits.
- Verificar internet, cargadores y acceso al admin en al menos dos dispositivos.
- Si se usara RFID, probar `/reads/ingest` con el token real antes de la salida.
- No usar endpoints de prueba para guardar lecturas reales.

## Despues Del Evento

- Exportar inscritos finales.
- Exportar o respaldar lecturas si hubo RFID.
- Revisar pagos marcados como `paid_after_registration_expired`.
- Documentar incidencias: pagos tardios, duplicados, errores de talla, cambios manuales y reclamos.
