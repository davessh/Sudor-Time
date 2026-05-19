from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event, EventModality, Category
from schemas.category import CategoryCreate, CategoryResponse
from security import require_admin

router = APIRouter(prefix="/categories", tags=["Categories"])


def _same_sex_filter(query, sexo):
    if sexo is None:
        return query.filter(Category.sexo.is_(None))
    return query.filter(Category.sexo == sexo)


@router.post("", response_model=CategoryResponse, dependencies=[Depends(require_admin)])
def crear_categoria(data: CategoryCreate, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    modalidad = db.query(EventModality).filter(EventModality.id == data.modality_id).first()
    if not modalidad:
        raise HTTPException(status_code=404, detail="Modalidad no encontrada")

    if modalidad.event_id != data.event_id:
        raise HTTPException(status_code=400, detail="La modalidad no pertenece al evento indicado")

    existente_query = db.query(Category).filter(
        Category.event_id == data.event_id,
        Category.modality_id == data.modality_id,
        Category.nombre == data.nombre,
    )
    existente = _same_sex_filter(existente_query, data.sexo).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre en esa modalidad")

    nueva = Category(**data.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("", response_model=list[CategoryResponse])
def listar_categorias(
    event_id: Optional[int] = None,
    modality_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Category)

    if event_id is not None:
        query = query.filter(Category.event_id == event_id)

    if modality_id is not None:
        query = query.filter(Category.modality_id == modality_id)

    return query.order_by(Category.id.asc()).all()


@router.get("/{category_id}", response_model=CategoryResponse)
def obtener_categoria(category_id: int, db: Session = Depends(get_db)):
    categoria = db.query(Category).filter(Category.id == category_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria


@router.put("/{category_id}", response_model=CategoryResponse, dependencies=[Depends(require_admin)])
def actualizar_categoria(category_id: int, data: CategoryCreate, db: Session = Depends(get_db)):
    categoria = db.query(Category).filter(Category.id == category_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    modalidad = db.query(EventModality).filter(EventModality.id == data.modality_id).first()
    if not modalidad:
        raise HTTPException(status_code=404, detail="Modalidad no encontrada")

    if modalidad.event_id != data.event_id:
        raise HTTPException(status_code=400, detail="La modalidad no pertenece al evento indicado")

    repetida_query = db.query(Category).filter(
        Category.event_id == data.event_id,
        Category.modality_id == data.modality_id,
        Category.nombre == data.nombre,
        Category.id != category_id,
    )
    repetida = _same_sex_filter(repetida_query, data.sexo).first()

    if repetida:
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre en esa modalidad")

    for key, value in data.model_dump().items():
        setattr(categoria, key, value)

    db.commit()
    db.refresh(categoria)
    return categoria


@router.delete("/{category_id}", dependencies=[Depends(require_admin)])
def eliminar_categoria(category_id: int, db: Session = Depends(get_db)):
    categoria = db.query(Category).filter(Category.id == category_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    db.delete(categoria)
    db.commit()
    return {"message": "Categoría eliminada correctamente"}
