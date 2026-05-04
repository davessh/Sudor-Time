from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, nullable=False)

    registration_tags = relationship("RegistrationTag", back_populates="tag")
    raw_reads = relationship("RawRead", back_populates="tag")


class RegistrationTag(Base):
    __tablename__ = "registration_tags"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"))
    tag_id = Column(Integer, ForeignKey("tags.id"))
    activo = Column(Boolean, default=True)

    registration = relationship("Registration", back_populates="registration_tags")
    tag = relationship("Tag", back_populates="registration_tags")