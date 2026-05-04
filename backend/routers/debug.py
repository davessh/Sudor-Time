from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/debug", tags=["Debug"])


@router.post("/reads")
def recibir_lectura_libre(data: Dict[str, Any]):
    print("Lectura debug recibida: ", data)

    return {
        "status": "Recibido Sudortime",
        "received": data
    }