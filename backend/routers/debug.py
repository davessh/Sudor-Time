from fastapi import APIRouter, Depends
from typing import Dict, Any

from security import require_admin

router = APIRouter(prefix="/debug", tags=["Debug"], dependencies=[Depends(require_admin)])


@router.post("/reads")
def recibir_lectura_libre(data: Dict[str, Any]):
    print("Lectura debug recibida: ", data)

    return {
        "status": "Recibido Sudortime",
        "received": data
    }
