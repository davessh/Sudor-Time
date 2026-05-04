from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Event, Checkpoint, RawRead
from schemas.result import (
    ResultResponse,
    ResultListResponse,
    CategoryTop3Response,
    OfficialSummaryResponse,
)
from utils.formatters import ms_a_texto

router = APIRouter(prefix="/results", tags=["Results"])


def construir_resultados_evento(
    event_id: int,
    db: Session,
    modality_id: Optional[int] = None,
    category_id: Optional[int] = None,
):
    evento = db.query(Event).filter(Event.id == event_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    checkpoint_salida = (
        db.query(Checkpoint)
        .filter(
            Checkpoint.event_id == event_id,
            Checkpoint.es_salida == True
        )
        .first()
    )

    checkpoint_meta = (
        db.query(Checkpoint)
        .filter(
            Checkpoint.event_id == event_id,
            Checkpoint.es_meta == True
        )
        .first()
    )

    if not checkpoint_meta:
        raise HTTPException(status_code=400, detail="No existe checkpoint de meta para este evento")

    lecturas_evento = (
        db.query(RawRead)
        .filter(
            RawRead.event_id == event_id,
            RawRead.registration_id.isnot(None)
        )
        .order_by(RawRead.timestamp.asc())
        .all()
    )

    if not lecturas_evento:
        return []

    disparo_oficial = None
    if checkpoint_salida:
        lecturas_salida_evento = [
            lectura for lectura in lecturas_evento
            if lectura.checkpoint_id == checkpoint_salida.id
        ]
        if lecturas_salida_evento:
            disparo_oficial = lecturas_salida_evento[0].timestamp

    lecturas_por_registro = {}
    for lectura in lecturas_evento:
        if lectura.registration_id not in lecturas_por_registro:
            lecturas_por_registro[lectura.registration_id] = []
        lecturas_por_registro[lectura.registration_id].append(lectura)

    resultados = []

    for registration_id, lecturas in lecturas_por_registro.items():
        registro = lecturas[0].registration
        if not registro or not registro.participant:
            continue

        if modality_id is not None and registro.modality_id != modality_id:
            continue

        if category_id is not None and registro.category_id != category_id:
            continue

        lectura_salida_corredor = None
        lectura_meta_corredor = None

        if checkpoint_salida:
            for lectura in lecturas:
                if lectura.checkpoint_id == checkpoint_salida.id:
                    lectura_salida_corredor = lectura
                    break

        for lectura in lecturas:
            if lectura.checkpoint_id == checkpoint_meta.id:
                lectura_meta_corredor = lectura
                break

        if not lectura_meta_corredor:
            continue

        tiempo_chip_ms = None
        if lectura_salida_corredor:
            delta_chip = lectura_meta_corredor.timestamp - lectura_salida_corredor.timestamp
            if delta_chip.total_seconds() >= 0:
                tiempo_chip_ms = int(delta_chip.total_seconds() * 1000)

        tiempo_oficial_ms = None
        if disparo_oficial:
            delta_oficial = lectura_meta_corredor.timestamp - disparo_oficial
            if delta_oficial.total_seconds() >= 0:
                tiempo_oficial_ms = int(delta_oficial.total_seconds() * 1000)

        participante = registro.participant

        resultados.append(
            {
                "registration_id": registro.id,
                "participant_id": participante.id,
                "nombre": participante.nombre,
                "apellido_paterno": participante.apellido_paterno,
                "apellido_materno": participante.apellido_materno,
                "sexo": participante.sexo,
                "numero_competidor": registro.numero_competidor,
                "modalidad_nombre": registro.modality.nombre if registro.modality else "",
                "categoria_id": registro.category.id if registro.category else None,
                "categoria_nombre": registro.category.nombre if registro.category else "Sin categoría",
                "tag_code": lectura_meta_corredor.tag_code,
                "salida_corredor": lectura_salida_corredor.timestamp if lectura_salida_corredor else None,
                "meta_corredor": lectura_meta_corredor.timestamp,
                "tiempo_chip_ms": tiempo_chip_ms,
                "tiempo_chip_texto": ms_a_texto(tiempo_chip_ms),
                "tiempo_oficial_ms": tiempo_oficial_ms,
                "tiempo_oficial_texto": ms_a_texto(tiempo_oficial_ms),
            }
        )

    resultados.sort(
        key=lambda x: (
            x["tiempo_oficial_ms"] is None,
            x["tiempo_oficial_ms"] if x["tiempo_oficial_ms"] is not None else 999999999,
            x["meta_corredor"]
        )
    )

    conteo_rama = {}
    conteo_categoria = {}

    salida = []

    for i, item in enumerate(resultados, start=1):
        sexo_key = (item["sexo"] or "sin_rama").strip().lower()
        conteo_rama[sexo_key] = conteo_rama.get(sexo_key, 0) + 1
        lugar_rama = conteo_rama[sexo_key]

        categoria_key = item["categoria_id"] if item["categoria_id"] is not None else f"sin_categoria_{sexo_key}"
        conteo_categoria[categoria_key] = conteo_categoria.get(categoria_key, 0) + 1
        lugar_categoria = conteo_categoria[categoria_key]

        salida.append(
            ResultResponse(
                lugar_general=i,
                lugar_rama=lugar_rama,
                lugar_categoria=lugar_categoria,
                registration_id=item["registration_id"],
                participant_id=item["participant_id"],
                nombre=item["nombre"],
                apellido_paterno=item["apellido_paterno"],
                apellido_materno=item["apellido_materno"],
                sexo=item["sexo"],
                numero_competidor=item["numero_competidor"],
                modalidad_nombre=item["modalidad_nombre"],
                categoria_nombre=item["categoria_nombre"],
                tag_code=item["tag_code"],
                salida_corredor=item["salida_corredor"],
                meta_corredor=item["meta_corredor"],
                tiempo_chip_ms=item["tiempo_chip_ms"],
                tiempo_chip_texto=item["tiempo_chip_texto"],
                tiempo_oficial_ms=item["tiempo_oficial_ms"],
                tiempo_oficial_texto=item["tiempo_oficial_texto"],
                categoria_id=item["categoria_id"],
            )
        )

    return salida


@router.get("/event/{event_id}", response_model=ResultListResponse)
def resultados_por_evento(
    event_id: int,
    modality_id: Optional[int] = Query(default=None),
    category_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db)
):
    resultados = construir_resultados_evento(
        event_id=event_id,
        db=db,
        modality_id=modality_id,
        category_id=category_id,
    )

    return ResultListResponse(
        total=len(resultados),
        resultados=resultados
    )


@router.get("/event/{event_id}/official-summary", response_model=OfficialSummaryResponse)
def resumen_oficial_evento(
    event_id: int,
    modality_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db)
):
    resultados = construir_resultados_evento(
        event_id=event_id,
        db=db,
        modality_id=modality_id,
        category_id=None,
    )

    categorias_map = {}

    for resultado in resultados:
        categoria_nombre = resultado.categoria_nombre or "Sin categoría"
        categoria_id = resultado.categoria_id
        key = categoria_id if categoria_id is not None else categoria_nombre
        if key not in categorias_map:
            categorias_map[key] = {
                "categoria_id": categoria_id,
                "categoria_nombre": categoria_nombre,
                "top_3": []
            }

        if resultado.lugar_categoria is not None and resultado.lugar_categoria <= 3:
            categorias_map[key]["top_3"].append(resultado)

    categorias = [
        CategoryTop3Response(
            categoria_id=item["categoria_id"],
            categoria_nombre=item["categoria_nombre"],
            top_3=item["top_3"]
        )
        for item in categorias_map.values()
    ]

    categorias.sort(key=lambda x: x.categoria_nombre.lower())

    return OfficialSummaryResponse(
        total_resultados=len(resultados),
        general=resultados,
        categorias=categorias,
    )