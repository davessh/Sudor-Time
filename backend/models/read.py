from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class RawRead(Base):
    __tablename__ = "raw_reads"

    id = Column(Integer, primary_key=True, index=True)

    event_id = Column(Integer, ForeignKey("events.id"))
    checkpoint_id = Column(Integer, ForeignKey("checkpoints.id"))
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=True)

    tag_code = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)

    event = relationship("Event", back_populates="raw_reads")
    checkpoint = relationship("Checkpoint", back_populates="raw_reads")
    tag = relationship("Tag", back_populates="raw_reads")
    registration = relationship("Registration", back_populates="raw_reads")