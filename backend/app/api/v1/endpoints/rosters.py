from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_admin
from app.core.database import get_db
from app.crud.crud_roster import roster as crud_roster
from app.crud.crud_site import site as crud_site
from app.crud.crud_guard import guard as crud_guard
from app.crud.crud_client import client as crud_client
from app.models.enums import ShiftType, RosterStatus, UserRole
from app.models.roster import ShiftRoster
from app.models.user import User
from app.schemas.roster import (
    ShiftRosterCreate,
    ShiftRosterUpdate,
    ShiftRosterResponse,
    WeeklyRosterAssignRequest,
    WeeklyRosterAssignResponse,
)

router = APIRouter()


@router.get("/", response_model=List[ShiftRosterResponse])
def read_rosters(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    site_id: Optional[int] = None,
    guard_id: Optional[int] = None,
    roster_date: Optional[date] = None,
    shift_type: Optional[ShiftType] = None,
    status: Optional[RosterStatus] = None,
    current_user: User = Depends(get_current_active_user),
) -> List[ShiftRosterResponse]:
    """Retrieve shift rosters. Scoped for CLIENT (own sites only) and STAFF (own shifts only)."""
    query = db.query(crud_roster.model)

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        own_client = crud_client.get_by_user_id(db, user_id=current_user.id)
        if not own_client:
            return []
        site_ids = [s.id for s in own_client.sites]
        if not site_ids:
            return []
        if site_id:
            if site_id not in site_ids:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden: you can only query rosters for your own sites.",
                )
            query = query.filter(crud_roster.model.site_id == site_id)
        else:
            query = query.filter(crud_roster.model.site_id.in_(site_ids))
    elif current_user.role == UserRole.STAFF and not current_user.is_superuser:
        own_guard = crud_guard.get_by_user_id(db, user_id=current_user.id)
        if not own_guard:
            return []
        query = query.filter(crud_roster.model.guard_id == own_guard.id)
    else:
        # ADMIN
        if site_id:
            query = query.filter(crud_roster.model.site_id == site_id)
        if guard_id:
            query = query.filter(crud_roster.model.guard_id == guard_id)

    if roster_date:
        query = query.filter(crud_roster.model.date == roster_date)
    if shift_type:
        query = query.filter(crud_roster.model.shift_type == shift_type)
    if status:
        query = query.filter(crud_roster.model.status == status)

    return query.order_by(crud_roster.model.date.desc()).offset(skip).limit(limit).all()


@router.post("/weekly", response_model=WeeklyRosterAssignResponse, status_code=http_status.HTTP_201_CREATED)
def assign_weekly_roster(
    *,
    db: Session = Depends(get_db),
    roster_batch: WeeklyRosterAssignRequest,
    current_user: User = Depends(require_admin),
) -> WeeklyRosterAssignResponse:
    """Batch assign guards to a weekly ShiftRoster schedule for a site (Admin only)."""
    db_site = crud_site.get(db, id=roster_batch.site_id)
    if not db_site:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Site with ID {roster_batch.site_id} not found.",
        )

    start_date = roster_batch.start_date
    end_date = roster_batch.end_date or (start_date + timedelta(days=6))

    if end_date < start_date:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="end_date cannot be earlier than start_date.",
        )

    saved_rosters: List[ShiftRoster] = []

    for item in roster_batch.assignments:
        if not (start_date <= item.date <= end_date):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Assignment date {item.date} is outside the scheduled range ({start_date} to {end_date}).",
            )

        db_guard = crud_guard.get(db, id=item.guard_id)
        if not db_guard:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Guard profile with ID {item.guard_id} not found.",
            )

        # Check conflict on same guard, date, shift_type across any site
        conflict = (
            db.query(ShiftRoster)
            .filter(
                ShiftRoster.guard_id == item.guard_id,
                ShiftRoster.date == item.date,
                ShiftRoster.shift_type == item.shift_type,
            )
            .first()
        )

        if conflict and conflict.site_id != roster_batch.site_id:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Guard {item.guard_id} is already scheduled at Site {conflict.site_id} on {item.date} for {item.shift_type.value} shift.",
            )

        if conflict and conflict.site_id == roster_batch.site_id:
            # Update existing roster slot
            conflict.notes = item.notes
            conflict.status = RosterStatus.SCHEDULED
            saved_rosters.append(conflict)
        else:
            new_roster = ShiftRoster(
                site_id=roster_batch.site_id,
                guard_id=item.guard_id,
                date=item.date,
                shift_type=item.shift_type,
                status=RosterStatus.SCHEDULED,
                notes=item.notes,
            )
            db.add(new_roster)
            saved_rosters.append(new_roster)

    db.commit()
    for r in saved_rosters:
        db.refresh(r)

    return WeeklyRosterAssignResponse(
        site_id=roster_batch.site_id,
        start_date=start_date,
        end_date=end_date,
        total_scheduled=len(saved_rosters),
        rosters=saved_rosters,
    )


@router.post("/", response_model=ShiftRosterResponse, status_code=http_status.HTTP_201_CREATED)
def create_roster(
    *,
    db: Session = Depends(get_db),
    roster_in: ShiftRosterCreate,
    current_user: User = Depends(require_admin),
) -> ShiftRosterResponse:
    """Schedule an individual shift for a guard at a site (Admin only)."""
    db_site = crud_site.get(db, id=roster_in.site_id)
    if not db_site:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Site not found.",
        )
    db_guard = crud_guard.get(db, id=roster_in.guard_id)
    if not db_guard:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Guard profile not found.",
        )
    existing_shift = crud_roster.get_by_guard_date_shift(
        db,
        guard_id=roster_in.guard_id,
        roster_date=roster_in.date,
        shift_type=roster_in.shift_type,
    )
    if existing_shift:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Guard is already assigned to a shift for this date and time slot.",
        )
    return crud_roster.create(db, obj_in=roster_in)


@router.get("/{roster_id}", response_model=ShiftRosterResponse)
def read_roster(
    *,
    db: Session = Depends(get_db),
    roster_id: int,
    current_user: User = Depends(get_current_active_user),
) -> ShiftRosterResponse:
    """Get shift roster by ID."""
    db_roster = crud_roster.get(db, id=roster_id)
    if not db_roster:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Shift roster entry not found.",
        )

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        own_client = crud_client.get_by_user_id(db, user_id=current_user.id)
        if not own_client or db_roster.site.client_id != own_client.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view shift rosters for your own sites.",
            )
    elif current_user.role == UserRole.STAFF and not current_user.is_superuser:
        own_guard = crud_guard.get_by_user_id(db, user_id=current_user.id)
        if not own_guard or db_roster.guard_id != own_guard.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view your own shift assignments.",
            )

    return db_roster


@router.put("/{roster_id}", response_model=ShiftRosterResponse)
def update_roster(
    *,
    db: Session = Depends(get_db),
    roster_id: int,
    roster_in: ShiftRosterUpdate,
    current_user: User = Depends(require_admin),
) -> ShiftRosterResponse:
    """Update shift roster assignment or status (Admin only)."""
    db_roster = crud_roster.get(db, id=roster_id)
    if not db_roster:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Shift roster entry not found.",
        )
    if roster_in.site_id:
        if not crud_site.get(db, id=roster_in.site_id):
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Site not found.",
            )
    if roster_in.guard_id:
        if not crud_guard.get(db, id=roster_in.guard_id):
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Guard profile not found.",
            )
    return crud_roster.update(db, db_obj=db_roster, obj_in=roster_in)


@router.delete("/{roster_id}", response_model=ShiftRosterResponse)
def delete_roster(
    *,
    db: Session = Depends(get_db),
    roster_id: int,
    current_user: User = Depends(require_admin),
) -> ShiftRosterResponse:
    """Delete a shift roster entry (Admin only)."""
    db_roster = crud_roster.get(db, id=roster_id)
    if not db_roster:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Shift roster entry not found.",
        )
    return crud_roster.remove(db, id=roster_id)
