# SudorTime - Contexto Del Proyecto

## Que Es SudorTime

SudorTime es un sistema web para gestionar eventos deportivos, principalmente carreras atleticas. La vision es que organizadores de eventos contraten el servicio y que, desde el sistema, se puedan administrar eventos, convocatorias, inscripciones, pagos, inscritos, resultados y mas adelante lecturas RFID.

El sistema se esta construyendo por fases. La prioridad actual es dejar funcional y confiable el flujo de inscripcion, antes de cerrar todo lo relacionado con resultados RFID.

## Contexto Rapido Para Futuras Sesiones

Leer este bloque antes de tocar UX/eventos/admin. Resume decisiones recientes para evitar redescubrir contexto en cada conversacion.

- La experiencia publica se esta redisenando mobile first. La prioridad es que el corredor se inscriba con el menor scroll posible.
- La pagina principal marca la estetica base: hero energetico, imagen de fondo y colores de marca. Las paginas internas deben sentirse integradas con esa misma familia visual.
- La pagina de evento no debe parecer otro sitio. Debe usar hero similar al principal, CTA temprano y CTA sticky en mobile.
- El hero del evento no debe contener la descripcion larga. La convocatoria/descripcion va mas abajo.
- No mostrar "desde $..." como gancho principal porque puede confundir si el precio menor corresponde a una carrera infantil u otra distancia muy distinta.
- El formulario de inscripcion debe sentirse enfocado y rapido. Por ahora no necesita hero completo, pero si debe heredar colores del evento.
- La pantalla de pago confirmado usa un "dorsal digital" como momento celebratorio, con opcion de compartir/descargar.
- Los precios y leyendas de pago no deben contaminar la pantalla de inscripcion confirmada; ahi el usuario ya debe sentir que esta dentro.

## Personalizacion Visual Y De Contenido Por Evento

Campos relevantes en `events`:

```text
cuenta_regresiva_at
color_primario
color_secundario
color_acento
imagen_hero
imagen_dorsal
```

Uso esperado:

- `color_primario`, `color_secundario`, `color_acento`: tematizan textos, botones, iconos, recuadros y detalles visuales del evento.
- `imagen_hero`: hero personalizado por evento. Si no existe, usar la imagen global de la pagina principal o fallback local.
- `imagen_dorsal`: imagen base opcional para el dorsal digital de confirmacion. Si no existe, usar el diseno default.
- `cuenta_regresiva_at`: fecha/hora objetivo para mostrar cuenta regresiva en la pagina publica del evento.

El kit del corredor ya no debe estar hardcodeado solo como playera/medalla. Existe una tabla configurable:

```text
event_kit_items
```

Campos principales:

```text
titulo
descripcion
imagen
orden
visible
```

`orden` significa orden de aparicion: los numeros mas bajos se muestran primero. Esto permite que un organizador muestre solo camiseta, o camiseta/medalla/morral/numero/etc. segun lo que incluya su carrera.

## Pantallas Publicas Recientes

### Pagina De Evento

Archivo principal:

```text
frontend/src/pages/EventPage.jsx
```

Decisiones UX:

- Mobile first.
- Hero integrado con la estetica principal.
- Sin descripcion larga dentro del hero.
- Cuatro recuadros de informacion esencial.
- CTA visible temprano y CTA sticky en mobile.
- Cuenta regresiva si `cuenta_regresiva_at` existe.
- Kit configurable desde admin.
- Convocatoria, galeria y detalles mas abajo, sin competir con el CTA.

### Formulario De Inscripcion

Archivo principal:

```text
frontend/src/pages/RegistrationPage.jsx
```

Decisiones UX:

- Pantalla enfocada, no una segunda landing.
- Hereda colores del evento.
- Prioridad: elegir modalidad/categoria/talla y completar datos sin distracciones.

### Confirmacion De Pago

Archivo principal:

```text
frontend/src/pages/PaymentPage.jsx
```

Decisiones UX:

- Si el pago ya esta aprobado, no mostrar banner de espera ni boton de actualizar estado.
- El centro visual es el dorsal digital.
- Permitir compartir o descargar imagen de confirmacion.
- Puede usar `imagen_dorsal` como base por evento; si falta, usar dorsal default.

## Fases Del Sistema

### Eventos

El sistema permite crear eventos deportivos con datos publicos como nombre, fecha, lugar, hora de salida, organizador, descripcion, imagen de convocatoria, modalidades, categorias, productos/paquetes y tallas.

La idea es que cada organizador pueda contratar el servicio y que el equipo de SudorTime configure el evento desde el panel administrativo.

### Inscripciones

El corredor llena un formulario publico de inscripcion. La inscripcion no debe considerarse confirmada hasta que el pago sea aprobado.

El flujo deseado es:

```text
Formulario publico
-> Preinscripcion pendiente de pago
-> Pago mediante pasarela
-> Confirmacion automatica por webhook
-> Inscripcion confirmada en admin
```

El corredor objetivo quiere un proceso simple. No siempre quiere pagar con tarjeta; tambien puede pedir opciones como efectivo en tiendas tipo OXXO, transferencia o alternativas similares. Por eso la pasarela elegida inicialmente es Mercado Pago Checkout Pro, ya que maneja opciones de pago desde su checkout hospedado y evita que SudorTime procese tarjetas directamente.

### Resultados

Los resultados vendran posteriormente de un sistema RFID fisico. Un microcontrolador enviara lecturas al backend mediante POST. Con esas lecturas se calcularan resultados generales, por rama/categoria, busqueda de atletas, detalles de participacion y certificados.

Esta fase aun no es prioridad porque el sistema fisico RFID sigue en desarrollo.

### Administracion

El panel admin permite gestionar eventos, inscritos, tags, lecturas, estadisticas, imagenes, precios, modalidades, categorias, tallas, abrir/cerrar inscripciones y modificar registros manualmente.

El admin debe poder usarse desde varios dispositivos porque varias personas del equipo operaran eventos y gestionaran inscripciones.

## Stack Actual

### Backend

- FastAPI.
- SQLAlchemy.
- PostgreSQL en Render.
- Uvicorn.
- Variables de entorno en Render.

### Frontend

- React.
- Vite.
- React Router.
- Tailwind CSS.

### Infraestructura

- Backend alojado en Render como Web Service.
- Base de datos PostgreSQL pagada en Render.
- Frontend aun pendiente de deploy publico definitivo.
- Archivos subidos actualmente servidos desde `/uploads`.

### Pagos

- Integracion inicial con Mercado Pago Checkout Pro.
- SudorTime no procesa tarjetas directamente.
- El backend crea preferencias de pago.
- Mercado Pago debe confirmar pagos mediante webhook.

## Problemas Detectados Y Corregidos

### Base De Datos

Inicialmente el backend estaba usando SQLite:

```text
sqlite:///./sudortime.db
```

Eso causaba que los datos registrados desde `/docs` o endpoints se perdieran al reiniciar/redeployar el backend, porque el archivo SQLite vivia dentro del contenedor efimero de Render.

Se corrigio `backend/database.py` para leer:

```text
DATABASE_URL
```

o alternativamente:

```text
DATABASE
```

Esto permite usar la base PostgreSQL de Render.

### Deploy Fallido En Render

Se detecto que un commit importaba `routers.dashboard`, pero `backend/routers/dashboard.py` no estaba commiteado. Eso podia causar un error en Render tipo:

```text
ModuleNotFoundError: No module named 'routers.dashboard'
```

La solucion fue asegurarse de incluir ese archivo en el commit.

### Inscripcion Sin Estado De Pago

Antes, una inscripcion se creaba como si ya estuviera completa. Se redisenio para que nazca como:

```text
status=pending_payment
payment_status=unpaid
```

Ahora existen estados de inscripcion:

```text
pending_payment
confirmed
cancelled
expired
```

Y estados/campos de pago:

```text
payment_status
amount
currency
payment_provider
payment_reference
payment_preference_id
payment_id
payment_checkout_url
payment_status_detail
payment_expires_at
paid_at
confirmed_at
cancelled_at
expires_at
expired_at
```

### Mercado Pago

Se agrego integracion inicial:

```text
POST /payments/mercadopago/create-preference
POST /payments/mercadopago/webhook
GET /payments/registrations/{registration_id}/status
```

El frontend tiene una pantalla:

```text
/inscripcion/:registrationId/pago
```

Despues de llenar el formulario, el corredor es enviado a esa pantalla para pagar.

Se corrigio un problema con `auto_return` de Mercado Pago. Mercado Pago rechazaba la preferencia cuando `FRONTEND_URL` no era una URL publica HTTPS valida. El backend ahora solo manda `auto_return` cuando la URL de frontend es publica y segura.

### Seguridad De Admin

Se agrego una primera barrera de seguridad mediante token:

```text
ADMIN_API_TOKEN
```

Los endpoints sensibles ahora requieren:

```text
Authorization: Bearer <ADMIN_API_TOKEN>
```

Tambien se agrego pantalla de login admin:

```text
/admin/login
```

El token se guarda en `sessionStorage` del navegador y se manda automaticamente en requests admin.

Esto es una proteccion inicial. A futuro se recomienda reemplazarlo o complementarlo con usuarios reales, contrasenas hasheadas, roles y auditoria.

### Validaciones Del Formulario

Se endurecieron validaciones del backend:

- Email validado.
- Telefonos con formato razonable.
- Nombres con longitud y caracteres permitidos.
- IDs positivos.
- Longitudes maximas.
- Normalizacion de sexo.
- Limpieza de espacios.

SQL injection no era la brecha principal porque se usa SQLAlchemy con queries parametrizadas, pero se reforzo la validacion de entrada para evitar datos basura, payloads raros y errores operativos.

### Uploads De Imagenes

Se limitaron y validaron imagenes:

- Extensiones permitidas: JPG, JPEG, PNG, WEBP.
- Tamano maximo: 5 MB.
- Validacion basica de firma/magic bytes.

## Por Que Se Borran Las Fotos

La base de datos solo guarda la ruta de la imagen, por ejemplo:

```text
/uploads/eventos/evento-2-xxxxx.jpg
```

Pero el archivo fisico vive en el disco del backend. En Render, el filesystem normal del Web Service es efimero. Al reiniciar o hacer deploy, los archivos subidos pueden desaparecer.

Solucion rapida:

1. Crear Persistent Disk en Render.
2. Montarlo en:

```text
/var/data
```

3. Configurar:

```text
UPLOADS_DIR=/var/data/uploads
```

Solucion mas robusta a largo plazo:

- Cloudinary.
- S3.
- Supabase Storage.
- Otro object storage externo.

## Caducidad De Preinscripciones

Se agrego expiracion de preinscripciones pendientes.

Variable:

```text
REGISTRATION_EXPIRATION_HOURS=48
```

Comportamiento:

- Una preinscripcion `pending_payment` recibe `expires_at`.
- Si vence, pasa a `expired`.
- Se guarda `expired_at`.
- Se libera talla/stock.

El sistema expira pendientes cuando:

- Se listan inscripciones.
- Se consulta una inscripcion.
- Se intenta crear una preferencia de pago.
- El admin presiona el boton "Expirar vencidas".

Endpoint admin:

```text
POST /registrations/expire-pending
POST /registrations/expire-pending?event_id=2
```

A futuro se recomienda automatizarlo con un cron job de Render.

## Variables De Entorno Importantes

En el Web Service del backend en Render:

```text
DATABASE_URL=postgresql://...
ADMIN_API_TOKEN=token_largo_y_privado
UPLOADS_DIR=/var/data/uploads
REGISTRATION_EXPIRATION_HOURS=48
BACKEND_PUBLIC_URL=https://sudor-time.onrender.com
FRONTEND_URL=https://tu-frontend-publico.com
CORS_ORIGINS=https://tu-frontend-publico.com,http://localhost:5173,http://127.0.0.1:5173
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_WEBHOOK_SECRET=...
MERCADOPAGO_WEBHOOK_URL=https://sudor-time.onrender.com/payments/mercadopago/webhook
```

Notas:

- No guardar secretos en Git.
- No pegar tokens completos en chats.
- Rotar credenciales si se exponen.
- `FRONTEND_URL` debe ser la URL publica real del frontend, no `/docs` ni el backend.

## Mercado Pago

Para configurar Mercado Pago:

1. Crear app en Mercado Pago Developers.
2. Usar Checkout Pro.
3. Copiar `Access Token`.
4. Configurar webhook:

```text
https://sudor-time.onrender.com/payments/mercadopago/webhook
```

5. Activar evento de pagos.
6. Copiar webhook secret.
7. Configurar variables en Render.

Para pruebas:

- Si se usa token de prueba, usar usuarios/tarjetas de prueba.
- Si se usa token productivo, la cuenta debe estar lista para operar.
- El webhook confirma pagos. No se debe confiar solo en la pantalla de retorno.

## Pendientes Importantes Antes De Deploy Real

### Alta Prioridad

1. Configurar Persistent Disk en Render para imagenes.
2. Desplegar frontend publico.
3. Configurar `FRONTEND_URL` y `CORS_ORIGINS`.
4. Configurar `ADMIN_API_TOKEN`.
5. Probar que sin token no se pueda entrar a endpoints admin.
6. Probar flujo completo:

```text
Crear evento
Crear modalidad/precio
Crear categorias
Crear tallas
Inscribirse
Quedar pending_payment
Pagar
Webhook confirma
Ver confirmed en admin
```

7. Automatizar expiracion de preinscripciones con cron.

### Media Prioridad

1. Exportar inscritos a CSV/Excel.
2. Enviar correo o WhatsApp de confirmacion.
3. Pagina publica para consultar estado de inscripcion.
4. Mejorar texto/acentos donde aparezca encoding roto.
5. Revisar rutas de resultados, porque frontend y backend aun tienen inconsistencias.
6. Quitar o mantener muy controlado `/debug`.

### Alta Prioridad Posterior

1. Usuarios admin reales.
2. Roles por evento.
3. Logs de auditoria.
4. Migraciones formales con Alembic.
5. Almacenamiento externo para imagenes.

## Riesgos Actuales

- El admin usa token global, no usuarios individuales.
- Las imagenes dependen de Persistent Disk o almacenamiento externo.
- No hay todavia sistema de auditoria.
- No hay migraciones formales con Alembic.
- Resultados/RFID todavia no estan cerrados.
- Falta deploy publico del frontend.
- Falta prueba end-to-end de Mercado Pago en ambiente real.

## Siguiente Rubro Recomendado

El siguiente rubro recomendado es preparar el sistema para deploy de pruebas reales:

1. Configurar Persistent Disk.
2. Crear `ADMIN_API_TOKEN` en Render.
3. Desplegar frontend.
4. Configurar `FRONTEND_URL` y `CORS_ORIGINS`.
5. Probar flujo de inscripcion completo con Mercado Pago.
6. Agregar cron para `POST /registrations/expire-pending`.

Despues de eso, el siguiente desarrollo funcional deberia ser:

- Exportacion de inscritos.
- Notificaciones de confirmacion.
- Consulta publica de estado de inscripcion.
- Usuarios admin reales con roles.
