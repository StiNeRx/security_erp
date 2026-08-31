from sqlalchemy import Column, String, Integer, ForeignKey, Numeric, Date, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import InvoiceStatus


class Invoice(BaseModel):
    __tablename__ = "invoices"

    client_id = Column(
        Integer,
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    billing_month = Column(String(20), index=True, nullable=False)  # e.g., "2026-08"
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0.00)
    tax_rate = Column(Numeric(4, 2), nullable=False, default=18.00)  # Percentage (e.g. 18% GST)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    status = Column(
        SQLEnum(InvoiceStatus, name="invoice_status_enum", native_enum=True),
        default=InvoiceStatus.DRAFT,
        nullable=False,
        index=True,
    )
    notes = Column(Text, nullable=True)

    # Relationships
    client = relationship("Client", back_populates="invoices")

    def __repr__(self) -> str:
        return f"<Invoice(id={self.id}, invoice_number='{self.invoice_number}', client_id={self.client_id}, total={self.total_amount}, status='{self.status}')>"
