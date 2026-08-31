from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Client(BaseModel):
    __tablename__ = "clients"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    company_name = Column(String(255), unique=True, index=True, nullable=False)
    contact_person = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    billing_address = Column(Text, nullable=False)
    gst_number = Column(String(50), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="client_profile")
    sites = relationship("Site", back_populates="client", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Client(id={self.id}, company_name='{self.company_name}')>"
