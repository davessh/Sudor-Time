# SudorTime RFID Proxy

Mini receptor HTTP para micros que no soportan HTTPS correctamente. El micro manda HTTP plano a este servicio y este servicio reenvia la lectura al backend de SudorTime en Render usando HTTPS.

## Flujo

```text
Micro/SIM800C -> HTTP -> rfid-proxy -> HTTPS -> SudorTime Render
```

## Configuracion

```bash
npm install
cp .env.example .env
npm start
```

Variables:

```env
PORT=3000
RENDER_URL=https://sudor-time.onrender.com/reads/pruebaMicro
PROXY_SHARED_TOKEN=
RETRY_INTERVAL_MS=30000
DATA_DIR=./data
```

Para pruebas deja `RENDER_URL` apuntando a:

```text
https://sudor-time.onrender.com/reads/pruebaMicro
```

Para guardar lecturas reales cambia `RENDER_URL` a:

```text
https://sudor-time.onrender.com/reads/ingest
```

El proxy guarda una bitacora de lo que recibe en:

```text
data/received.ndjson
```

Si Render falla o responde con error, la lectura queda pendiente en:

```text
data/pending.ndjson
```

El proxy reintenta mandar pendientes cada `RETRY_INTERVAL_MS`.

## URL para el micro

```text
POST http://TU_IP_O_DOMINIO/rfid
Content-Type: application/x-www-form-urlencoded

tag_code=TEST123&reader_id=1&timestamp=2026-05-04T12:00:00
```

Para guardar lectura real:

```text
event_id=1&reader_id=1&tag_code=TEST123&timestamp=2026-05-04T12:00:00
```

## Nginx recomendado

El proxy corre internamente en el puerto `3000`. Para exponerlo en HTTP puerto 80:

```nginx
server {
    listen 80;
    server_name TU_IP_O_DOMINIO;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## PM2 recomendado

```bash
npm install -g pm2
pm2 start server.js --name sudortime-rfid-proxy
pm2 save
pm2 startup
```
