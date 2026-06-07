from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from config import SITE_UPLOADS_DIR
from dependencies import get_db
from models import SiteSettings
from schemas.site_settings import SiteSettingsResponse, SiteSettingsUpdate
from security import require_admin

router = APIRouter(prefix="/site-settings", tags=["Site Settings"])

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _get_or_create_settings(db: Session) -> SiteSettings:
    settings = db.query(SiteSettings).filter(SiteSettings.id == 1).first()
    if settings:
        return settings

    settings = SiteSettings(id=1)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def _public_site_upload_path(filename: str) -> str:
    return f"/uploads/site/{filename}"


def _looks_like_allowed_image(data: bytes, extension: str) -> bool:
    if extension in {".jpg", ".jpeg"}:
        return data.startswith(b"\xff\xd8\xff")
    if extension == ".png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if extension == ".webp":
        return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return False


@router.get("", response_model=SiteSettingsResponse)
def obtener_ajustes_sitio(db: Session = Depends(get_db)):
    return _get_or_create_settings(db)


@router.put("", response_model=SiteSettingsResponse, dependencies=[Depends(require_admin)])
def actualizar_ajustes_sitio(data: SiteSettingsUpdate, db: Session = Depends(get_db)):
    settings = _get_or_create_settings(db)
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "hero_background_fit" and value not in {"cover", "contain"}:
            raise HTTPException(status_code=400, detail="El modo de fondo debe ser cover o contain")
        if key in {
            "hero_background_position_x",
            "hero_background_position_y",
            "hero_background_opacity",
            "navbar_blur",
            "navbar_opacity",
        } and value is not None:
            value = max(0, min(100, int(value)))
        setattr(settings, key, value)

    db.commit()
    db.refresh(settings)
    return settings


@router.post("/upload-hero-background", response_model=SiteSettingsResponse, dependencies=[Depends(require_admin)])
async def subir_fondo_hero(file: UploadFile = File(...), db: Session = Depends(get_db)):
    settings = _get_or_create_settings(db)

    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Sube una imagen JPG, PNG o WEBP")

    content_type = file.content_type or ""
    if content_type and not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    SITE_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"hero-{uuid4().hex}{extension}"
    destination = SITE_UPLOADS_DIR / filename

    total_bytes = 0
    first_chunk = b""
    with destination.open("wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            if not first_chunk:
                first_chunk = chunk[:16]
                if not _looks_like_allowed_image(first_chunk, extension):
                    destination.unlink(missing_ok=True)
                    raise HTTPException(status_code=400, detail="El archivo no parece ser una imagen válida")

            total_bytes += len(chunk)
            if total_bytes > MAX_UPLOAD_BYTES:
                destination.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail="La imagen no debe superar 5 MB")

            buffer.write(chunk)

    settings.hero_background_image = _public_site_upload_path(filename)
    db.commit()
    db.refresh(settings)
    return settings
