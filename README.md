# SudorTime

SudorTime es una plataforma web para gestionar eventos deportivos, principalmente carreras atleticas: eventos, convocatorias, inscripciones, pagos, inscritos, resultados y, mas adelante, RFID.

El contexto largo del proyecto vive en [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md). Para futuras sesiones con Codex o cualquier asistente, leer primero ese archivo evita repetir decisiones ya tomadas y reduce uso de tokens.

## Stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL en Render.
- Frontend: React, Vite, React Router, Tailwind CSS.
- Pagos: Mercado Pago Checkout Pro.
- Uploads: actualmente en `/uploads`; en Render requieren Persistent Disk u object storage.

## Estado UX Reciente

Las pantallas publicas se estan redisenando mobile first, con prioridad en conversion:

- La pagina principal define la estetica base: hero energetico, imagen de fondo y colores de marca.
- La pagina publica de evento debe sentirse integrada con la principal, no como una landing distinta.
- La pagina de evento debe reducir scroll hacia la inscripcion: CTA arriba y CTA sticky en mobile.
- El hero de evento no debe cargar la descripcion larga; la descripcion/convocatoria vive mas abajo.
- El formulario de inscripcion se mantiene mas enfocado, sin hero completo, pero hereda colores del evento.
- La confirmacion de pago usa un "dorsal digital" compartible/descargable.

## Personalizacion Por Evento

Desde admin se busca que cada evento pueda tener su propia identidad visual y contenido:

- `color_primario`, `color_secundario`, `color_acento`: tematizan textos, botones, iconos y recuadros.
- `imagen_hero`: imagen hero personalizada del evento; si falta, se usa la imagen principal global.
- `imagen_dorsal`: base opcional para el dorsal digital de confirmacion; si falta, hay diseno default.
- `cuenta_regresiva_at`: fecha/hora objetivo para mostrar cuenta regresiva en la pagina del evento.
- `event_kit_items`: items configurables de "Lo que recibe el corredor".
- Personalizacion de dorsal: promo configurable por evento para primeros N registros gratis y costo extra posterior.

En los items del kit, `orden` significa orden de aparicion: numeros mas bajos salen primero. Esto permite mostrar solo camiseta, o camiseta/medalla/morral/numero/etc. segun cada organizador.

## Archivos Clave

- Backend eventos/modelos: `backend/models/event.py`
- Backend schemas evento: `backend/schemas/event.py`
- Endpoints eventos/admin/uploads: `backend/routers/events.py`
- Mantenimiento simple de columnas: `backend/schema_maintenance.py`
- Pagos Mercado Pago: `backend/routers/payments.py`
- API frontend eventos: `frontend/src/api/events.js`
- Pagina publica de evento: `frontend/src/pages/EventPage.jsx`
- Formulario de inscripcion: `frontend/src/pages/RegistrationPage.jsx`
- Confirmacion/pago/dorsal: `frontend/src/pages/PaymentPage.jsx`
- Admin setup evento: `frontend/src/pages/admin/AdminEventSetupPage.jsx`
- Auditoria de seguridad: `SECURITY_AUDIT.md`

## Verificacion Recomendada

Frontend:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```

Backend:

```powershell
python -m compileall backend
```

En este entorno local de Codex, el Browser plugin puede fallar por sandbox de Windows. Si eso pasa, usar lint/build/compile como verificacion minima y avisar al usuario.
