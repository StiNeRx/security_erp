from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Site(BaseModel):
    __tablename__ = "sites"

    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    site_name = Column(String(255), index=True, nullable=False)
    site_code = Column(String(50), unique=True, index=True, nullable=True)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    # JSON containing requirements: e.g. {"day_shift_guards": 2, "night_shift_guards": 2, "supervisor_required": True}
    shift_requirements = Column(JSON, default=dict, nullable=False)
    contact_phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    client = relationship("Client", back_populates="sites")
    rosters = relationship("ShiftRoster", back_populates="site", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Site(id={self.id}, site_name='{self.site_name}', client_id={self.client_id})>"
