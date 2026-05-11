from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from models import Category, Participant, Event


def calcular_edad(fecha_nacimiento: Optional[date], fecha_evento: Optional[date] = None) -> Optional[int]:
    if not fecha_nacimiento:
        return None

    referencia = fecha_evento or date.today()
    edad = referencia.year - fecha_nacimiento.year

    if (referencia.month, referencia.day) < (fecha_nacimiento.month, fecha_nacimiento.day):
        edad -= 1

    return edad


def normalizar_sexo(valor: Optional[str]) -> Optional[str]:
    if not valor:
        return None

    valor = valor.strip().lower()

    if valor in ["m", "masculino", "h", "hombre", "varon", "varón"]:
        return "masculino"

    if valor in ["f", "femenino", "mujer"]:
        return "femenino"

    return valor


def categoria_coincide(categoria: Category, sexo: Optional[str], edad: Optional[int]) -> bool:
    sexo_participante = normalizar_sexo(sexo)
    sexo_categoria = normalizar_sexo(categoria.sexo)

    if sexo_categoria and sexo_participante and sexo_categoria != sexo_participante:
        return False

    if categoria.edad_min is not None:
        if edad is None or edad < categoria.edad_min:
            return False

    if categoria.edad_max is not None:
        if edad is None or edad > categoria.edad_max:
            return False

    return True


def buscar_categoria_automatica(
    db: Session,
    event_id: int,
    modality_id: int,
    participante: Participant,
    evento: Event,
) -> Optional[Category]:
    edad = calcular_edad(participante.fecha_nacimiento, evento.fecha)

    categorias = (
        db.query(Category)
        .filter(
            Category.event_id == event_id,
            Category.modality_id == modality_id,
        )
        .order_by(Category.edad_min.asc(), Category.edad_max.asc(), Category.id.asc())
        .all()
    )

    for categoria in categorias:
        if categoria_coincide(categoria, participante.sexo, edad):
            return categoria

    return None
