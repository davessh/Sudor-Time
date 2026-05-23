from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
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

    status = Column(String(32), nullable=False, default="pending_payment")
    payment_status = Column(String(32), nullable=False, default="unpaid")
    amount = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(3), nullable=False, default="MXN")
    payment_provider = Column(String(50), nullable=True)
    payment_reference = Column(String(255), nullable=True)
    payment_preference_id = Column(String(255), nullable=True)
    payment_id = Column(String(255), nullable=True)
    payment_checkout_url = Column(String(1024), nullable=True)
    payment_status_detail = Column(String(100), nullable=True)
    payment_expires_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    public_token = Column(String(128), nullable=True, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    expired_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    event = relationship("Event", back_populates="registrations")
    participant = relationship("Participant", back_populates="registrations")
    modality = relationship("EventModality", back_populates="registrations")
    product = relationship("RegistrationProduct", back_populates="registrations")
    category = relationship("Category", back_populates="registrations")

    registration_tags = relationship("RegistrationTag", back_populates="registration")
    raw_reads = relationship("RawRead", back_populates="registration")
    result = relationship("Result", back_populates="registration", uselist=False)
