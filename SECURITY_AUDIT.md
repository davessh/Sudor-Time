# SudorTime - Auditoria Rapida De Seguridad Y Alta Demanda

Fecha: 2026-06-11

Este documento resume riesgos relevantes para promociones con alta demanda, bots y pagos.

## Mitigaciones Implementadas

- SQL injection: el backend usa SQLAlchemy con filtros parametrizados. No se detecto construccion directa de SQL con datos publicos en el flujo de inscripcion.
- Validacion de entrada: Pydantic valida IDs positivos, email/telefono en participante, longitudes y texto de dorsal personalizado.
- Duplicados: el backend bloquea una inscripcion activa o pendiente por correo/telefono/participante en el mismo evento.
- Stock/promo: tallas y promo usan estados activos `pending_payment` y `confirmed`; las preinscripciones vencidas liberan recursos.
- Promo de dorsal: el derecho gratis se reserva al crear la preinscripcion, no al volver de Mercado Pago. Esto evita sobreventa del beneficio durante picos.
- Concurrencia: el conteo de promo bloquea la fila del evento con `with_for_update()` al crear/editar inscripcion.
- Pago: Mercado Pago confirma por webhook, valida monto/moneda y no confia solo en el retorno del navegador.
- Webhook: hay validacion HMAC con `MERCADOPAGO_WEBHOOK_SECRET` en produccion.
- Busqueda publica por datos personales: esta deshabilitada con HTTP 410.
- Rate limit basico: se agrego limite en memoria para crear/editar preinscripciones y crear preferencias de Mercado Pago.

## Riesgos Pendientes

- Rate limit en memoria no sirve si Render escala a multiples instancias. Para produccion seria mejor Cloudflare, Render rate limiting, Redis o un WAF.
- No hay CAPTCHA/Turnstile en el formulario publico. Si la promo genera competencia real, agregar Cloudflare Turnstile antes de crear preinscripcion.
- No hay cola o waiting room. En alta demanda extrema, muchas personas pueden reservar preinscripciones pendientes y luego no pagar.
- No hay migraciones formales con Alembic. `schema_maintenance.py` ayuda, pero no reemplaza migraciones auditables.
- Admin usa token global. Conviene usuarios reales, roles por evento, MFA y auditoria de acciones.
- CORS depende de variables. En produccion, `CORS_ORIGINS` debe limitarse a dominios reales.
- Uploads dependen de validacion basica por magic bytes y extension. Para mas seguridad, usar object storage y re-procesar imagenes.
- No hay CSP/security headers declarados desde backend/frontend.
- El endpoint `/debug` debe estar deshabilitado o protegido en produccion.

## Recomendado Antes De Abrir Promo Publica

1. Configurar `PUBLIC_RATE_LIMIT_PER_MINUTE` con un valor conservador, por ejemplo `10` o `15`.
2. Poner Cloudflare delante del frontend/backend y activar Bot Fight Mode o reglas por ruta.
3. Agregar Cloudflare Turnstile al formulario antes de `POST /registrations/public`.
4. Reducir `REGISTRATION_EXPIRATION_HOURS` para promos de alta demanda, por ejemplo 1 a 3 horas.
5. Crear job/cron que ejecute `POST /registrations/expire-pending` cada pocos minutos durante la promo.
6. Proteger o remover `/debug` en produccion.
7. Migrar cambios de esquema a Alembic antes de crecer el sistema.
8. Agregar logs de auditoria para admin y cambios de precio/promo.

## Nota Sobre La Promo

La regla actual es: las primeras N preinscripciones activas del evento reciben derecho gratis a personalizar dorsal. Si no pagan y vencen, su lugar se libera. Despues de agotar N lugares activos, el corredor todavia puede personalizar, pero se suma el costo extra configurado en admin.

