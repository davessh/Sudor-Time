from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from config import GALLERY_UPLOADS_DIR
from dependencies import get_db
from models import GalleryAlbum
from schemas.gallery import GalleryAlbumCreate, GalleryAlbumResponse, GalleryAlbumUpdate
from security import require_admin

router = APIRouter(prefix="/gallery", tags=["Gallery"])

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _public_gallery_upload_path(filename: str) -> str:
    return f"/uploads/galeria/{filename}"


def _looks_like_allowed_image(data: bytes, extension: str) -> bool:
    if extension in {".jpg", ".jpeg"}:
        return data.startswith(b"\xff\xd8\xff")
    if extension == ".png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if extension == ".webp":
        return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return False


def _query_ordered_albums(db: Session):
    return db.query(GalleryAlbum).order_by(
        GalleryAlbum.orden.asc(),
        GalleryAlbum.fecha.desc(),
        GalleryAlbum.created_at.desc(),
    )


@router.get("", response_model=list[GalleryAlbumResponse])
def listar_albumes_publicos(db: Session = Depends(get_db)):
    return _query_ordered_albums(db).filter(GalleryAlbum.visible == True).all()


@router.get("/admin", response_model=list[GalleryAlbumResponse], dependencies=[Depends(require_admin)])
def listar_albumes_admin(db: Session = Depends(get_db)):
    return _query_ordered_albums(db).all()


@router.post("", response_model=GalleryAlbumResponse, dependencies=[Depends(require_admin)])
def crear_album(data: GalleryAlbumCreate, db: Session = Depends(get_db)):
    payload = data.model_dump()
    payload["facebook_url"] = str(payload["facebook_url"])
    album = GalleryAlbum(**payload)
    db.add(album)
    db.commit()
    db.refresh(album)
    return album


@router.put("/{album_id}", response_model=GalleryAlbumResponse, dependencies=[Depends(require_admin)])
def actualizar_album(album_id: int, data: GalleryAlbumUpdate, db: Session = Depends(get_db)):
    album = db.query(GalleryAlbum).filter(GalleryAlbum.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Álbum no encontrado")

    payload = data.model_dump(exclude_unset=True)
    if "facebook_url" in payload and payload["facebook_url"] is not None:
        payload["facebook_url"] = str(payload["facebook_url"])

    for key, value in payload.items():
        setattr(album, key, value)

    db.commit()
    db.refresh(album)
    return album


@router.delete("/{album_id}", dependencies=[Depends(require_admin)])
def eliminar_album(album_id: int, db: Session = Depends(get_db)):
    album = db.query(GalleryAlbum).filter(GalleryAlbum.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album no encontrado")

    db.delete(album)
    db.commit()
    return {"message": "Álbum eliminado correctamente"}


@router.post("/{album_id}/upload-cover", response_model=GalleryAlbumResponse, dependencies=[Depends(require_admin)])
async def subir_portada_album(
    album_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    album = db.query(GalleryAlbum).filter(GalleryAlbum.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Álbum no encontrado")

    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Sube una imagen JPG, PNG o WEBP")

    content_type = file.content_type or ""
    if content_type and not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    GALLERY_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"album-{album_id}-{uuid4().hex}{extension}"
    destination = GALLERY_UPLOADS_DIR / filename

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

    album.imagen_portada = _public_gallery_upload_path(filename)
    db.commit()
    db.refresh(album)
    return album
