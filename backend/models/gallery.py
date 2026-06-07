from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from database import Base


class GalleryAlbum(Base):
    __tablename__ = "gallery_albums"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    facebook_url = Column(Text, nullable=False)
    imagen_portada = Column(Text, nullable=True)
    fecha = Column(Date, nullable=True)
    visible = Column(Boolean, nullable=False, default=True)
    orden = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
