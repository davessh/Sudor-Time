const dotenv = require("dotenv");
const express = require("express");
const fs = require("fs/promises");
const path = require("path");

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 3000);
const RENDER_URL = process.env.RENDER_URL || "https://sudor-time.onrender.com/reads/pruebaMicro";
const PROXY_SHARED_TOKEN = process.env.PROXY_SHARED_TOKEN || "";
const RETRY_INTERVAL_MS = Number(process.env.RETRY_INTERVAL_MS || 30000);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const RECEIVED_LOG = path.join(DATA_DIR, "received.ndjson");
const PENDING_LOG = path.join(DATA_DIR, "pending.ndjson");

let retryInProgress = false;

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ type: "application/json" }));
app.use(express.text({ type: () => true }));

function normalizePayload(req) {
  const queryPayload = new URLSearchParams(req.query).toString();

  if (typeof req.body === "string" && req.body.trim()) {
    return req.body.trim();
  }

  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    return new URLSearchParams(req.body).toString();
  }

  return queryPayload;
}

async function forwardToRender(payload) {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (PROXY_SHARED_TOKEN) {
    headers["X-RFID-Token"] = PROXY_SHARED_TOKEN;
  }

  const response = await fetch(RENDER_URL, {
    method: "POST",
    headers,
    body: payload,
  });

  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    text,
  };
}

async function appendJsonLine(filePath, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(data)}\n`, "utf8");
}

async function savePending(payload, reason) {
  await appendJsonLine(PENDING_LOG, {
    time: new Date().toISOString(),
    payload,
    reason,
  });
}

async function retryPendingReads() {
  if (retryInProgress) {
    return;
  }

  retryInProgress = true;

  try {
    const pendingText = await fs.readFile(PENDING_LOG, "utf8").catch(() => "");
    const lines = pendingText.split(/\r?\n/).filter(Boolean);

    if (!lines.length) {
      return;
    }

    const stillPending = [];

    for (const line of lines) {
      let entry;

      try {
        entry = JSON.parse(line);
      } catch (error) {
        console.error(`No se pudo leer pendiente: ${error.message}`);
        continue;
      }

      try {
        const response = await forwardToRender(entry.payload);

        if (!response.ok) {
          stillPending.push(entry);
          console.error(`Reintento fallo con status ${response.status}: ${response.text}`);
          continue;
        }

        console.log(`Pendiente reenviado correctamente: ${entry.payload}`);
      } catch (error) {
        stillPending.push(entry);
        console.error(`Reintento fallo: ${error.message}`);
      }
    }

    const nextContent = stillPending.map((entry) => JSON.stringify(entry)).join("\n");
    await fs.writeFile(PENDING_LOG, nextContent ? `${nextContent}\n` : "", "utf8");
  } finally {
    retryInProgress = false;
  }
}

app.get("/", (req, res) => {
  res.status(200).send("SudorTime RFID proxy OK");
});

async function handleRfidRequest(req, res) {
  const payload = normalizePayload(req);
  const receivedEntry = {
    time: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    payload,
  };

  console.log(JSON.stringify(receivedEntry));

  try {
    await appendJsonLine(RECEIVED_LOG, receivedEntry);

    if (!payload) {
      console.log(
        JSON.stringify({
          time: new Date().toISOString(),
          message: "Solicitud recibida sin payload. Se responde 200 OK para prueba de comunicacion.",
        })
      );
      res.status(200).send("200 OK");
      return;
    }

    const renderResponse = await forwardToRender(payload);

    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        renderStatus: renderResponse.status,
        renderResponse: renderResponse.text,
      })
    );

    if (!renderResponse.ok) {
      await savePending(payload, `Render status ${renderResponse.status}`);
    }

    res.status(200).send("200 OK");
  } catch (error) {
    console.error(
      JSON.stringify({
        time: new Date().toISOString(),
        error: error.message,
      })
    );

    await savePending(payload, error.message);
    res.status(200).send("200 OK");
  }
}

app.all(["/rfid", "/pruebaMicro", "/reads/pruebaMicro"], handleRfidRequest);

app.listen(PORT, () => {
  console.log(`SudorTime RFID proxy escuchando en puerto ${PORT}`);
  console.log(`Reenviando lecturas a ${RENDER_URL}`);
});

setInterval(retryPendingReads, RETRY_INTERVAL_MS);
