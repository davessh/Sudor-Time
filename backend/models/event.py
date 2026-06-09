from sqlalchemy import (
    Column, Integer, String, ForeignKey, Date, DateTime,
    Boolean, Numeric, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=True)
    descripcion = Column(Text, nullable=True)
    fecha = Column(Date, nullable=False)
    lugar = Column(String, nullable=False)
    hora_salida = Column(String, nullable=True)
    organizador = Column(String, nullable=True)
    inscripciones_abiertas = Column(Boolean, default=True)
    color_primario = Column(String(20), nullable=True)
    color_secundario = Column(String(20), nullable=True)
    color_acento = Column(String(20), nullable=True)
    imagen_hero = Column(Text, nullable=True)
    imagen_portada = Column(Text, nullable=True)
    imagen_convocatoria = Column(Text, nullable=True)
    imagen_playera = Column(Text, nullable=True)
    imagen_medalla = Column(Text, nullable=True)
    imagen_dorsal = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    modalities = relationship("EventModality", back_populates="event", cascade="all, delete-orphan")
    products = relationship("RegistrationProduct", back_populates="event", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="event", cascade="all, delete-orphan")
    shirt_sizes = relationship("EventShirtSize", back_populates="event", cascade="all, delete-orphan")
    kit_items = relationship("EventKitItem", back_populates="event", cascade="all, delete-orphan")
    checkpoints = relationship("Checkpoint", back_populates="event", cascade="all, delete-orphan")
    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")
    raw_reads = relationship("RawRead", back_populates="event", cascade="all, delete-orphan")
    results = relationship("Result", back_populates="event", cascade="all, delete-orphan")


class EventModality(Base):
    __tablename__ = "event_modalities"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    nombre = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    precio = Column(Numeric(10, 2), nullable=False, default=0)
    distancia_km = Column(Numeric(6, 2), nullable=True)
    incluye_playera = Column(Boolean, default=False, nullable=False)

    event = relationship("Event", back_populates="modalities")
    registrations = relationship("Registration", back_populates="modality")
    products = relationship("RegistrationProduct", back_populates="modality")
    categories = relationship("Category", back_populates="modality")

    __table_args__ = (
        UniqueConstraint("event_id", "nombre", name="uq_event_modality"),
    )


class RegistrationProduct(Base):
    __tablename__ = "registration_products"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    modality_id = Column(Integer, ForeignKey("event_modalities.id"), nullable=True)

    nombre = Column(String, nullable=False)
    precio = Column(Numeric(10, 2), nullable=False)
    incluye_playera = Column(Boolean, default=False, nullable=False)

    event = relationship("Event", back_populates="products")
    modality = relationship("EventModality", back_populates="products")
    registrations = relationship("Registration", back_populates="product")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    modality_id = Column(Integer, ForeignKey("event_modalities.id"), nullable=False)

    nombre = Column(String, nullable=False)
    sexo = Column(String, nullable=True)  # Masculino, Femenino o NULL para mixta
    edad_min = Column(Integer, nullable=True)
    edad_max = Column(Integer, nullable=True)

    event = relationship("Event", back_populates="categories")
    modality = relationship("EventModality", back_populates="categories")
    registrations = relationship("Registration", back_populates="category")


class EventShirtSize(Base):
    __tablename__ = "event_shirt_sizes"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    talla = Column(String, nullable=False)
    stock = Column(Integer, nullable=True)
    activa = Column(Boolean, default=True)

    event = relationship("Event", back_populates="shirt_sizes")

    __table_args__ = (
        UniqueConstraint("event_id", "talla", name="uq_event_shirt_size"),
    )


class EventKitItem(Base):
    __tablename__ = "event_kit_items"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    titulo = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    imagen = Column(Text, nullable=True)
    orden = Column(Integer, nullable=False, default=0)
    visible = Column(Boolean, default=True, nullable=False)

    event = relationship("Event", back_populates="kit_items")


class Checkpoint(Base):
    __tablename__ = "checkpoints"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)

    nombre = Column(String, nullable=False)
    es_salida = Column(Boolean, default=False)
    es_meta = Column(Boolean, default=False)

    event = relationship("Event", back_populates="checkpoints")
    raw_reads = relationship("RawRead", back_populates="checkpoint")
