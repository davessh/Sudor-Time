def ms_a_texto(ms: int | None) -> str | None:
    if ms is None:
        return None

    total_segundos = ms // 1000
    horas = total_segundos // 3600
    minutos = (total_segundos % 3600) // 60
    segundos = total_segundos % 60

    return f"{horas:02d}:{minutos:02d}:{segundos:02d}"