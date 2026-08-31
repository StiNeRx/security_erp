from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_admin
from app.core.database import get_db
from app.crud.crud_invoice import invoice as crud_invoice
from app.crud.crud_client import client as crud_client
from app.models.enums import InvoiceStatus, UserRole
from app.models.user import User
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
)

router = APIRouter()


@router.get("/", response_model=List[InvoiceResponse])
def read_invoices(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    client_id: Optional[int] = None,
    billing_month: Optional[str] = None,
    status: Optional[InvoiceStatus] = None,
    current_user: User = Depends(get_current_active_user),
) -> List[InvoiceResponse]:
    """Retrieve invoices. Admin views all; Client views own invoices; Staff denied."""
    if current_user.role == UserRole.STAFF and not current_user.is_superuser:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Staff accounts cannot view client billing invoices.",
        )

    query = db.query(crud_invoice.model)

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        own_client = crud_client.get_by_user_id(db, user_id=current_user.id)
        if not own_client:
            return []
        query = query.filter(crud_invoice.model.client_id == own_client.id)
    else:
        if client_id:
            query = query.filter(crud_invoice.model.client_id == client_id)

    if billing_month:
        query = query.filter(crud_invoice.model.billing_month == billing_month)
    if status:
        query = query.filter(crud_invoice.model.status == status)

    return query.order_by(crud_invoice.model.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=InvoiceResponse, status_code=http_status.HTTP_201_CREATED)
def create_invoice(
    *,
    db: Session = Depends(get_db),
    invoice_in: InvoiceCreate,
    current_user: User = Depends(require_admin),
) -> InvoiceResponse:
    """Create a new client invoice (Admin only)."""
    db_client = crud_client.get(db, id=invoice_in.client_id)
    if not db_client:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    existing_inv = crud_invoice.get_by_invoice_number(
        db, invoice_number=invoice_in.invoice_number
    )
    if existing_inv:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="An invoice with this invoice number already exists.",
        )
    return crud_invoice.create(db, obj_in=invoice_in)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def read_invoice(
    *,
    db: Session = Depends(get_db),
    invoice_id: int,
    current_user: User = Depends(get_current_active_user),
) -> InvoiceResponse:
    """Get invoice details by ID."""
    db_invoice = crud_invoice.get(db, id=invoice_id)
    if not db_invoice:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    if current_user.role == UserRole.STAFF and not current_user.is_superuser:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Staff accounts cannot view client billing invoices.",
        )
    elif current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        own_client = crud_client.get_by_user_id(db, user_id=current_user.id)
        if not own_client or db_invoice.client_id != own_client.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view your own invoices.",
            )

    return db_invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    *,
    db: Session = Depends(get_db),
    invoice_id: int,
    invoice_in: InvoiceUpdate,
    current_user: User = Depends(require_admin),
) -> InvoiceResponse:
    """Update invoice values or status (Admin only)."""
    db_invoice = crud_invoice.get(db, id=invoice_id)
    if not db_invoice:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )
    if invoice_in.client_id:
        db_client = crud_client.get(db, id=invoice_in.client_id)
        if not db_client:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Client not found.",
            )
    if invoice_in.invoice_number and invoice_in.invoice_number != db_invoice.invoice_number:
        existing = crud_invoice.get_by_invoice_number(
            db, invoice_number=invoice_in.invoice_number
        )
        if existing:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Invoice number already exists.",
            )
    return crud_invoice.update(db, db_obj=db_invoice, obj_in=invoice_in)


@router.delete("/{invoice_id}", response_model=InvoiceResponse)
def delete_invoice(
    *,
    db: Session = Depends(get_db),
    invoice_id: int,
    current_user: User = Depends(require_admin),
) -> InvoiceResponse:
    """Delete an invoice (Admin only)."""
    db_invoice = crud_invoice.get(db, id=invoice_id)
    if not db_invoice:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )
    return crud_invoice.remove(db, id=invoice_id)
