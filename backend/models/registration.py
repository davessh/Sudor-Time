from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)

    event_id = Column(Integer, ForeignKey("events.id"))
    participant_id = Column(Integer, ForeignKey("participants.id"))
    modality_id = Column(Integer, ForeignKey("event_modalities.id"))
    product_id = Column(Integer, ForeignKey("registration_products.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    numero_competidor = Column(String, nullable=True)
    talla_playera = Column(String, nullable=True)

    event = relationship("Event", back_populates="registrations")
    participant = relationship("Participant", back_populates="registrations")
    modality = relationship("EventModality", back_populates="registrations")
    product = relationship("RegistrationProduct", back_populates="registrations")
    category = relationship("Category", back_populates="registrations")

    registration_tags = relationship("RegistrationTag", back_populates="registration")
    raw_reads = relationship("RawRead", back_populates="registration")
    result = relationship("Result", back_populates="registration", uselist=False)
