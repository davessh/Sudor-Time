from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event, Registration

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def obtener_estadisticas_dashboard(db: Session = Depends(get_db)):
    total_eventos = db.query(Event).count()
    total_inscritos = db.query(Registration).count()
    eventos_abiertos = db.query(Event).filter(Event.inscripciones_abiertas == True).count()

    proximos_eventos = (
        db.query(Event)
        .filter(Event.fecha >= date.today())
        .order_by(Event.fecha.asc())
        .limit(5)
        .all()
    )

    inscritos_por_evento = (
        db.query(Event.id, Event.nombre, func.count(Registration.id).label("total"))
        .outerjoin(Registration, Registration.event_id == Event.id)
        .group_by(Event.id, Event.nombre)
        .order_by(func.count(Registration.id).desc(), Event.fecha.desc())
        .limit(8)
        .all()
    )

    return {
        "total_eventos": total_eventos,
        "total_inscritos": total_inscritos,
        "eventos_abiertos": eventos_abiertos,
        "proximos_eventos": [
            {
                "id": evento.id,
                "nombre": evento.nombre,
                "fecha": evento.fecha,
                "lugar": evento.lugar,
                "inscripciones_abiertas": evento.inscripciones_abiertas,
            }
            for evento in proximos_eventos
        ],
        "inscritos_por_evento": [
            {"id": row[0], "nombre": row[1], "total": row[2]}
            for row in inscritos_por_evento
        ],
    }
