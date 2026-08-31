from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.invoice import Invoice
from app.models.enums import InvoiceStatus
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate


class CRUDInvoice(CRUDBase[Invoice, InvoiceCreate, InvoiceUpdate]):
    def get_by_invoice_number(
        self, db: Session, *, invoice_number: str
    ) -> Optional[Invoice]:
        return (
            db.query(Invoice)
            .filter(Invoice.invoice_number == invoice_number)
            .first()
        )

    def get_by_client(
        self, db: Session, *, client_id: int, skip: int = 0, limit: int = 100
    ) -> List[Invoice]:
        return (
            db.query(Invoice)
            .filter(Invoice.client_id == client_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_month(
        self, db: Session, *, billing_month: str, skip: int = 0, limit: int = 100
    ) -> List[Invoice]:
        return (
            db.query(Invoice)
            .filter(Invoice.billing_month == billing_month)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, db: Session, *, obj_in: InvoiceCreate) -> Invoice:
        # Calculate tax and total amounts if not explicitly provided
        subtotal = Decimal(str(obj_in.subtotal))
        tax_rate = Decimal(str(obj_in.tax_rate))
        tax_amount = (
            Decimal(str(obj_in.tax_amount))
            if obj_in.tax_amount is not None
            else round(subtotal * (tax_rate / Decimal("100")), 2)
        )
        total_amount = (
            Decimal(str(obj_in.total_amount))
            if obj_in.total_amount is not None
            else round(subtotal + tax_amount, 2)
        )

        db_obj = Invoice(
            client_id=obj_in.client_id,
            invoice_number=obj_in.invoice_number,
            billing_month=obj_in.billing_month,
            issue_date=obj_in.issue_date,
            due_date=obj_in.due_date,
            subtotal=subtotal,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            status=obj_in.status or InvoiceStatus.DRAFT,
            notes=obj_in.notes,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


invoice = CRUDInvoice(Invoice)
