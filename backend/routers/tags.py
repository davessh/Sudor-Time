from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Tag
from schemas.tag import TagCreate, TagResponse
from security import require_admin

router = APIRouter(prefix="/tags", tags=["Tags"], dependencies=[Depends(require_admin)])


@router.post("", response_model=TagResponse)
def crear_tag(data: TagCreate, db: Session = Depends(get_db)):
    existente = db.query(Tag).filter(Tag.codigo == data.codigo).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un tag con ese código")

    nuevo = Tag(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[TagResponse])
def listar_tags(db: Session = Depends(get_db)):
    return db.query(Tag).order_by(Tag.id.asc()).all()


@router.get("/{tag_id}", response_model=TagResponse)
def obtener_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag no encontrado")
    return tag


@router.put("/{tag_id}", response_model=TagResponse)
def actualizar_tag(tag_id: int, data: TagCreate, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag no encontrado")

    repetido = db.query(Tag).filter(
        Tag.codigo == data.codigo,
        Tag.id != tag_id
    ).first()

    if repetido:
        raise HTTPException(status_code=400, detail="Ya existe otro tag con ese código")

    for key, value in data.model_dump().items():
        setattr(tag, key, value)

    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}")
def eliminar_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag no encontrado")

    db.delete(tag)
    db.commit()
    return {"message": "Tag eliminado correctamente"}
