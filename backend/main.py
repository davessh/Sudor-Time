import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers.events import router as events_router
from routers.participants import router as participants_router
from routers.modalities import router as modalities_router
from routers.products import router as products_router
from routers.categories import router as categories_router
from routers.shirt_sizes import router as shirt_sizes_router
from routers.tags import router as tags_router
from routers.registrations import router as registrations_router
from routers.checkpoints import router as checkpoints_router
from routers.reads import router as reads_router
from routers.results import router as results_router
from routers.debug import router as debug_router
from routers.dashboard import router as dashboard_router
from routers.payments import router as payments_router
from schema_maintenance import ensure_registration_payment_columns


def get_cors_origins():
    origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    }

    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        origins.add(frontend_url.rstrip("/"))

    cors_origins = os.getenv("CORS_ORIGINS")
    if cors_origins:
        origins.update(origin.strip().rstrip("/") for origin in cors_origins.split(",") if origin.strip())

    return sorted(origins)

Base.metadata.create_all(bind=engine)
ensure_registration_payment_columns(engine)

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="SudorTime API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)
app.include_router(participants_router)
app.include_router(modalities_router)
app.include_router(products_router)
app.include_router(categories_router)
app.include_router(shirt_sizes_router)
app.include_router(tags_router)
app.include_router(registrations_router)
app.include_router(checkpoints_router)
app.include_router(reads_router)
app.include_router(results_router)
app.include_router(debug_router)
app.include_router(dashboard_router)
app.include_router(payments_router)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.get("/")
def root():
    return {"message": "SudorTime API funcionando con nueva estructura"}
