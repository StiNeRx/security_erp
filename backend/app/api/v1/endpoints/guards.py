from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_admin
from app.core.database import get_db
from app.crud.crud_guard import guard as crud_guard
from app.crud.crud_user import user as crud_user
from app.crud.crud_roster import roster as crud_roster
from app.models.enums import GuardStatus, UserRole
from app.models.user import User
from app.schemas.guard import (
    GuardProfileCreate,
    GuardProfileUpdate,
    GuardProfileResponse,
)
from app.schemas.roster import ShiftRosterResponse

router = APIRouter()


@router.get("/", response_model=List[GuardProfileResponse])
def read_guards(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[GuardStatus] = None,
    current_user: User = Depends(get_current_active_user),
) -> List[GuardProfileResponse]:
    """Retrieve security guard profiles. Admin sees all; Staff sees own profile only."""
    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Client accounts cannot browse guard profiles directly.",
        )

    if current_user.role == UserRole.STAFF and not current_user.is_superuser:
        own_guard = crud_guard.get_by_user_id(db, user_id=current_user.id)
        if not own_guard:
            return []
        return [own_guard]

    # ADMIN
    if status:
        return crud_guard.get_by_status(db, status=status, skip=skip, limit=limit)
    return crud_guard.get_multi(db, skip=skip, limit=limit)


@router.post("/", response_model=GuardProfileResponse, status_code=http_status.HTTP_201_CREATED)
def create_guard(
    *,
    db: Session = Depends(get_db),
    guard_in: GuardProfileCreate,
    current_user: User = Depends(require_admin),
) -> GuardProfileResponse:
    """Create a new guard profile attached to a User (Admin only)."""
    db_user = crud_user.get(db, id=guard_in.user_id)
    if not db_user:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Associated User not found.",
        )
    existing_user_guard = crud_guard.get_by_user_id(db, user_id=guard_in.user_id)
    if existing_user_guard:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="A guard profile already exists for this user.",
        )
    existing_badge = crud_guard.get_by_badge(db, badge_number=guard_in.badge_number)
    if existing_badge:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Badge number is already assigned.",
        )
    return crud_guard.create(db, obj_in=guard_in)


@router.get("/{guard_id}", response_model=GuardProfileResponse)
def read_guard(
    *,
    db: Session = Depends(get_db),
    guard_id: int,
    current_user: User = Depends(get_current_active_user),
) -> GuardProfileResponse:
    """Get guard profile by ID. Staff can view their own profile only."""
    db_guard = crud_guard.get(db, id=guard_id)
    if not db_guard:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Guard profile not found.",
        )

    if current_user.role == UserRole.STAFF and not current_user.is_superuser:
        if db_guard.user_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view your own guard profile.",
            )
    elif current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Client accounts cannot browse guard profiles.",
        )

    return db_guard


@router.put("/{guard_id}", response_model=GuardProfileResponse)
def update_guard(
    *,
    db: Session = Depends(get_db),
    guard_id: int,
    guard_in: GuardProfileUpdate,
    current_user: User = Depends(require_admin),
) -> GuardProfileResponse:
    """Update guard profile (Admin only)."""
    db_guard = crud_guard.get(db, id=guard_id)
    if not db_guard:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Guard profile not found.",
        )
    if guard_in.badge_number and guard_in.badge_number != db_guard.badge_number:
        existing = crud_guard.get_by_badge(db, badge_number=guard_in.badge_number)
        if existing:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Badge number is already assigned to another guard.",
            )
    return crud_guard.update(db, db_obj=db_guard, obj_in=guard_in)


@router.delete("/{guard_id}", response_model=GuardProfileResponse)
def delete_guard(
    *,
    db: Session = Depends(get_db),
    guard_id: int,
    current_user: User = Depends(require_admin),
) -> GuardProfileResponse:
    """Delete a guard profile (Admin only)."""
    db_guard = crud_guard.get(db, id=guard_id)
    if not db_guard:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Guard profile not found.",
        )
    return crud_guard.remove(db, id=guard_id)


@router.get("/{guard_id}/rosters", response_model=List[ShiftRosterResponse])
def read_guard_rosters(
    *,
    db: Session = Depends(get_db),
    guard_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
) -> List[ShiftRosterResponse]:
    """Get all shift rosters assigned to a guard."""
    db_guard = crud_guard.get(db, id=guard_id)
    if not db_guard:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Guard profile not found.",
        )

    if current_user.role == UserRole.STAFF and not current_user.is_superuser:
        if db_guard.user_id != current_user.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view your own shift schedule.",
            )
    elif current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Clients cannot access guard roster history directly.",
        )

    return crud_roster.get_guard_roster(db, guard_id=guard_id, skip=skip, limit=limit)
