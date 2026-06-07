import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", str(BASE_DIR / "uploads"))).resolve()
EVENT_UPLOADS_DIR = UPLOADS_DIR / "eventos"
SITE_UPLOADS_DIR = UPLOADS_DIR / "site"
