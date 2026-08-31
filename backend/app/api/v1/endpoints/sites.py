from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_admin
from app.core.database import get_db
from app.crud.crud_site import site as crud_site
from app.crud.crud_client import client as crud_client
from app.crud.crud_guard import guard as crud_guard
from app.crud.crud_roster import roster as crud_roster
from app.models.enums import UserRole
from app.models.roster import ShiftRoster
from app.models.user import User
from app.schemas.site import SiteCreate, SiteUpdate, SiteResponse
from app.schemas.roster import ShiftRosterResponse

router = APIRouter()


@router.get("/", response_model=List[SiteResponse])
def read_sites(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    client_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
) -> List[SiteResponse]:
    """Retrieve sites. ADMIN sees all; CLIENT sees only their own sites."""
    query = db.query(crud_site.model)

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        own_client = crud_client.get_by_user_id(db, user_id=current_user.id)
        if not own_client:
            return []
        query = query.filter(crud_site.model.client_id == own_client.id)
    elif current_user.role == UserRole.STAFF and not current_user.is_superuser:
        # Allow staff to view sites where they have shifts
        own_guard = crud_guard.get_by_user_id(db, user_id=current_user.id)
        if not own_guard:
            return []
        assigned_site_ids = [
            r.site_id
            for r in db.query(ShiftRoster.site_id)
            .filter(ShiftRoster.guard_id == own_guard.id)
            .distinct()
            .all()
        ]
        query = query.filter(crud_site.model.id.in_(assigned_site_ids))
    else:
        if client_id:
            query = query.filter(crud_site.model.client_id == client_id)

    if is_active is not None:
        query = query.filter(crud_site.model.is_active == is_active)

    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site(
    *,
    db: Session = Depends(get_db),
    site_in: SiteCreate,
    current_user: User = Depends(require_admin),
) -> SiteResponse:
    """Create a new deployment site for a client (Admin only)."""
    db_client = crud_client.get(db, id=site_in.client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found.",
        )
    if site_in.site_code:
        existing_code = crud_site.get_by_site_code(db, site_code=site_in.site_code)
        if existing_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A site with this site code already exists.",
            )
    return crud_site.create(db, obj_in=site_in)


@router.get("/{site_id}", response_model=SiteResponse)
def read_site(
    *,
    db: Session = Depends(get_db),
    site_id: int,
    current_user: User = Depends(get_current_active_user),
) -> SiteResponse:
    """Get site by ID. Clients can only view their own sites."""
    db_site = crud_site.get(db, id=site_id)
    if not db_site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found.",
        )

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        own_client = crud_client.get_by_user_id(db, user_id=current_user.id)
        if not own_client or db_site.client_id != own_client.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view sites belonging to your company.",
            )
    return db_site


@router.put("/{site_id}", response_model=SiteResponse)
def update_site(
    *,
    db: Session = Depends(get_db),
    site_id: int,
    site_in: SiteUpdate,
    current_user: User = Depends(require_admin),
) -> SiteResponse:
    """Update site information (Admin only)."""
    db_site = crud_site.get(db, id=site_id)
    if not db_site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found.",
        )
    if site_in.client_id:
        db_client = crud_client.get(db, id=site_in.client_id)
        if not db_client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found.",
            )
    if site_in.site_code and site_in.site_code != db_site.site_code:
        existing = crud_site.get_by_site_code(db, site_code=site_in.site_code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A site with this site code already exists.",
            )
    return crud_site.update(db, db_obj=db_site, obj_in=site_in)


@router.delete("/{site_id}", response_model=SiteResponse)
def delete_site(
    *,
    db: Session = Depends(get_db),
    site_id: int,
    current_user: User = Depends(require_admin),
) -> SiteResponse:
    """Delete a site (Admin only)."""
    db_site = crud_site.get(db, id=site_id)
    if not db_site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found.",
        )
    return crud_site.remove(db, id=site_id)


@router.get("/{site_id}/rosters", response_model=List[ShiftRosterResponse])
def read_site_rosters(
    *,
    db: Session = Depends(get_db),
    site_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
) -> List[ShiftRosterResponse]:
    """Get all shift rosters for a specific site."""
    db_site = crud_site.get(db, id=site_id)
    if not db_site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found.",
        )

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        own_client = crud_client.get_by_user_id(db, user_id=current_user.id)
        if not own_client or db_site.client_id != own_client.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view shift rosters for your own sites.",
            )
    elif current_user.role == UserRole.STAFF and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff accounts cannot view comprehensive site rosters. Use /rosters to view your assigned shifts.",
        )

    return crud_roster.get_site_roster(db, site_id=site_id, skip=skip, limit=limit)
