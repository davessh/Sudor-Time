from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship
from database import Base


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido_paterno = Column(String, nullable=False)
    apellido_materno = Column(String, nullable=True)

    fecha_nacimiento = Column(Date, nullable=True)
    sexo = Column(String, nullable=True)

    telefono = Column(String, nullable=True)
    correo = Column(String, nullable=True)
    ciudad = Column(String, nullable=True)
    equipo = Column(String, nullable=True)
    contacto_emergencia = Column(String, nullable=True)
    telefono_emergencia = Column(String, nullable=True)

    registrations = relationship("Registration", back_populates="participant")
