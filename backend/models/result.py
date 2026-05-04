from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)

    registration_id = Column(Integer, ForeignKey("registrations.id"), unique=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    modality_id = Column(Integer, ForeignKey("event_modalities.id"))
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    tiempo_oficial_ms = Column(Integer, nullable=True)
    lugar_general = Column(Integer, nullable=True)

    registration = relationship("Registration", back_populates="result")
    event = relationship("Event", back_populates="results")