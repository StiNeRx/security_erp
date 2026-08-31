from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_admin
from app.core.database import get_db
from app.crud.crud_client import client as crud_client
from app.crud.crud_site import site as crud_site
from app.crud.crud_invoice import invoice as crud_invoice
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.schemas.site import SiteResponse
from app.schemas.invoice import InvoiceResponse

router = APIRouter()


@router.get("/", response_model=List[ClientResponse])
def read_clients(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
) -> List[ClientResponse]:
    """Retrieve clients. ADMIN sees all; CLIENT sees only their own company profile."""
    if current_user.role == UserRole.STAFF and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff accounts cannot access client management records.",
        )

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        own_client = crud_client.get_by_user_id(db, user_id=current_user.id)
        if not own_client:
            return []
        return [own_client]

    # ADMIN
    if is_active is not None:
        return (
            db.query(crud_client.model)
            .filter(crud_client.model.is_active == is_active)
            .offset(skip)
            .limit(limit)
            .all()
        )
    return crud_client.get_multi(db, skip=skip, limit=limit)


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    *,
    db: Session = Depends(get_db),
    client_in: ClientCreate,
    current_user: User = Depends(require_admin),
) -> ClientResponse:
    """Register a new client company (Admin only)."""
    existing = crud_client.get_by_company_name(db, company_name=client_in.company_name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A client with this company name already exists.",
        )
    return crud_client.create(db, obj_in=client_in)


@router.get("/{client_id}", response_model=ClientResponse)
def read_client(
    *,
    db: Session = Depends(get_db),
    client_id: int,
    current_user: User = Depends(get_current_active_user),
) -> ClientResponse:
    """Get client by ID. Clients can only view their own record."""
    db_client = crud_client.get(db, id=client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        if db_client.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view your own client account.",
            )
    elif current_user.role == UserRole.STAFF and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff accounts cannot access client profile details.",
        )

    return db_client


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    *,
    db: Session = Depends(get_db),
    client_id: int,
    client_in: ClientUpdate,
    current_user: User = Depends(require_admin),
) -> ClientResponse:
    """Update client information (Admin only)."""
    db_client = crud_client.get(db, id=client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    if client_in.company_name and client_in.company_name != db_client.company_name:
        existing = crud_client.get_by_company_name(db, company_name=client_in.company_name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A client with this company name already exists.",
            )
    return crud_client.update(db, db_obj=db_client, obj_in=client_in)


@router.delete("/{client_id}", response_model=ClientResponse)
def delete_client(
    *,
    db: Session = Depends(get_db),
    client_id: int,
    current_user: User = Depends(require_admin),
) -> ClientResponse:
    """Delete a client (Admin only)."""
    db_client = crud_client.get(db, id=client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    return crud_client.remove(db, id=client_id)


@router.get("/{client_id}/sites", response_model=List[SiteResponse])
def read_client_sites(
    *,
    db: Session = Depends(get_db),
    client_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
) -> List[SiteResponse]:
    """Get all sites for a specific client."""
    db_client = crud_client.get(db, id=client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        if db_client.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view sites for your own account.",
            )
    elif current_user.role == UserRole.STAFF and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff accounts cannot browse client site rosters.",
        )

    return crud_site.get_by_client(db, client_id=client_id, skip=skip, limit=limit)


@router.get("/{client_id}/invoices", response_model=List[InvoiceResponse])
def read_client_invoices(
    *,
    db: Session = Depends(get_db),
    client_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
) -> List[InvoiceResponse]:
    """Get all invoices for a specific client."""
    db_client = crud_client.get(db, id=client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        if db_client.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view invoices for your own account.",
            )
    elif current_user.role == UserRole.STAFF and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff accounts cannot view billing invoices.",
        )

    return crud_invoice.get_by_client(db, client_id=client_id, skip=skip, limit=limit)
