from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event, EventModality, RegistrationProduct
from schemas.product import RegistrationProductCreate, RegistrationProductResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=RegistrationProductResponse)
def crear_producto(data: RegistrationProductCreate, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    if data.modality_id is not None:
        modalidad = db.query(EventModality).filter(EventModality.id == data.modality_id).first()
        if not modalidad:
            raise HTTPException(status_code=404, detail="Modalidad no encontrada")
        if modalidad.event_id != data.event_id:
            raise HTTPException(status_code=400, detail="La modalidad no pertenece al evento indicado")

    existente = db.query(RegistrationProduct).filter(
        RegistrationProduct.event_id == data.event_id,
        RegistrationProduct.nombre == data.nombre
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese nombre en este evento")

    nuevo = RegistrationProduct(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("", response_model=list[RegistrationProductResponse])
def listar_productos(
    event_id: Optional[int] = None,
    modality_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RegistrationProduct)

    if event_id is not None:
        query = query.filter(RegistrationProduct.event_id == event_id)

    if modality_id is not None:
        query = query.filter(RegistrationProduct.modality_id == modality_id)

    return query.order_by(RegistrationProduct.id.asc()).all()


@router.get("/{product_id}", response_model=RegistrationProductResponse)
def obtener_producto(product_id: int, db: Session = Depends(get_db)):
    producto = db.query(RegistrationProduct).filter(RegistrationProduct.id == product_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.put("/{product_id}", response_model=RegistrationProductResponse)
def actualizar_producto(product_id: int, data: RegistrationProductCreate, db: Session = Depends(get_db)):
    producto = db.query(RegistrationProduct).filter(RegistrationProduct.id == product_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    evento = db.query(Event).filter(Event.id == data.event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    if data.modality_id is not None:
        modalidad = db.query(EventModality).filter(EventModality.id == data.modality_id).first()
        if not modalidad:
            raise HTTPException(status_code=404, detail="Modalidad no encontrada")
        if modalidad.event_id != data.event_id:
            raise HTTPException(status_code=400, detail="La modalidad no pertenece al evento indicado")

    repetido = db.query(RegistrationProduct).filter(
        RegistrationProduct.event_id == data.event_id,
        RegistrationProduct.nombre == data.nombre,
        RegistrationProduct.id != product_id
    ).first()

    if repetido:
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese nombre en este evento")

    for key, value in data.model_dump().items():
        setattr(producto, key, value)

    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{product_id}")
def eliminar_producto(product_id: int, db: Session = Depends(get_db)):
    producto = db.query(RegistrationProduct).filter(RegistrationProduct.id == product_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db.delete(producto)
    db.commit()
    return {"message": "Producto eliminado correctamente"}