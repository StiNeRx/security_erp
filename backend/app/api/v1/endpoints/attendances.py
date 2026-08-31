from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_admin
from app.core.database import get_db
from app.crud.crud_attendance import attendance as crud_attendance
from app.crud.crud_roster import roster as crud_roster
from app.crud.crud_site import site as crud_site
from app.crud.crud_guard import guard as crud_guard
from app.crud.crud_client import client as crud_client
from app.models.attendance import Attendance
from app.models.enums import AttendanceStatus, RosterStatus, UserRole
from app.models.roster import ShiftRoster
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse,
    BulkAttendanceRequest,
    BulkAttendanceResponse,
)

router = APIRouter()


@router.get("/", response_model=List[AttendanceResponse])
def read_attendances(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[AttendanceStatus] = None,
    roster_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
) -> List[AttendanceResponse]:
    """Retrieve attendance logs with role scoping (Admin, Client, Staff)."""
    query = db.query(crud_attendance.model)

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        own_client = crud_client.get_by_user_id(db, user_id=current_user.id)
        if not own_client:
            return []
        site_ids = [s.id for s in own_client.sites]
        # Join with ShiftRoster to filter by client's sites
        query = (
            query.join(ShiftRoster, crud_attendance.model.roster_id == ShiftRoster.id)
            .filter(ShiftRoster.site_id.in_(site_ids))
        )
    elif current_user.role == UserRole.STAFF and not current_user.is_superuser:
        own_guard = crud_guard.get_by_user_id(db, user_id=current_user.id)
        if not own_guard:
            return []
        query = (
            query.join(ShiftRoster, crud_attendance.model.roster_id == ShiftRoster.id)
            .filter(ShiftRoster.guard_id == own_guard.id)
        )

    if status:
        query = query.filter(crud_attendance.model.status == status)
    if roster_id:
        query = query.filter(crud_attendance.model.roster_id == roster_id)

    return query.order_by(crud_attendance.model.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/bulk", response_model=BulkAttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_bulk_attendance(
    *,
    db: Session = Depends(get_db),
    bulk_in: BulkAttendanceRequest,
    current_user: User = Depends(get_current_active_user),
) -> BulkAttendanceResponse:
    """
    Mark or update bulk daily attendance for all scheduled guards at a site on a given date.
    Accessible to Admin and Staff supervisors.
    """
    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clients are not permitted to submit attendance records.",
        )

    db_site = crud_site.get(db, id=bulk_in.site_id)
    if not db_site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site with ID {bulk_in.site_id} not found.",
        )

    saved_attendances: List[Attendance] = []

    for item in bulk_in.attendances:
        db_roster = crud_roster.get(db, id=item.roster_id)
        if not db_roster:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shift roster entry with ID {item.roster_id} not found.",
            )

        if db_roster.site_id != bulk_in.site_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Roster ID {item.roster_id} does not belong to Site {bulk_in.site_id}.",
            )

        if db_roster.date != bulk_in.date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Roster ID {item.roster_id} date ({db_roster.date}) does not match attendance date ({bulk_in.date}).",
            )

        existing_attendance = crud_attendance.get_by_roster_id(db, roster_id=item.roster_id)
        if existing_attendance:
            existing_attendance.status = item.status
            existing_attendance.check_in_time = item.check_in_time
            existing_attendance.check_out_time = item.check_out_time
            existing_attendance.overtime_hours = item.overtime_hours
            existing_attendance.remarks = item.remarks
            saved_attendances.append(existing_attendance)
        else:
            new_att = Attendance(
                roster_id=item.roster_id,
                status=item.status,
                check_in_time=item.check_in_time,
                check_out_time=item.check_out_time,
                overtime_hours=item.overtime_hours,
                remarks=item.remarks,
            )
            db.add(new_att)
            saved_attendances.append(new_att)

        # Update ShiftRoster status based on attendance
        if item.status in [AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY, AttendanceStatus.LATE]:
            db_roster.status = RosterStatus.COMPLETED
        elif item.status == AttendanceStatus.ABSENT:
            db_roster.status = RosterStatus.CANCELLED

    db.commit()
    for att in saved_attendances:
        db.refresh(att)

    return BulkAttendanceResponse(
        site_id=bulk_in.site_id,
        date=bulk_in.date,
        total_marked=len(saved_attendances),
        attendances=saved_attendances,
    )


@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance(
    *,
    db: Session = Depends(get_db),
    attendance_in: AttendanceCreate,
    current_user: User = Depends(get_current_active_user),
) -> AttendanceResponse:
    """Record an individual attendance entry for a scheduled shift roster."""
    db_roster = crud_roster.get(db, id=attendance_in.roster_id)
    if not db_roster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift roster reference not found.",
        )

    if current_user.role == UserRole.STAFF and not current_user.is_superuser:
        own_guard = crud_guard.get_by_user_id(db, user_id=current_user.id)
        if not own_guard or db_roster.guard_id != own_guard.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only submit attendance for your own assigned shifts.",
            )
    elif current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client accounts are not permitted to submit attendance records.",
        )

    existing_attendance = crud_attendance.get_by_roster_id(
        db, roster_id=attendance_in.roster_id
    )
    if existing_attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance is already recorded for this roster shift.",
        )

    # Update roster status to completed if present
    if attendance_in.status in [AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY, AttendanceStatus.LATE]:
        db_roster.status = RosterStatus.COMPLETED

    return crud_attendance.create(db, obj_in=attendance_in)


@router.get("/{attendance_id}", response_model=AttendanceResponse)
def read_attendance(
    *,
    db: Session = Depends(get_db),
    attendance_id: int,
    current_user: User = Depends(get_current_active_user),
) -> AttendanceResponse:
    """Get attendance entry by ID."""
    db_attendance = crud_attendance.get(db, id=attendance_id)
    if not db_attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found.",
        )

    if current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        own_client = crud_client.get_by_user_id(db, user_id=current_user.id)
        if not own_client or db_attendance.roster.site.client_id != own_client.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view attendance for your own sites.",
            )
    elif current_user.role == UserRole.STAFF and not current_user.is_superuser:
        own_guard = crud_guard.get_by_user_id(db, user_id=current_user.id)
        if not own_guard or db_attendance.roster.guard_id != own_guard.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view your own attendance records.",
            )

    return db_attendance


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    *,
    db: Session = Depends(get_db),
    attendance_id: int,
    attendance_in: AttendanceUpdate,
    current_user: User = Depends(get_current_active_user),
) -> AttendanceResponse:
    """Update attendance status, check in/out times, or overtime hours."""
    db_attendance = crud_attendance.get(db, id=attendance_id)
    if not db_attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found.",
        )

    if current_user.role == UserRole.STAFF and not current_user.is_superuser:
        own_guard = crud_guard.get_by_user_id(db, user_id=current_user.id)
        if not own_guard or db_attendance.roster.guard_id != own_guard.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only update your own attendance records.",
            )
    elif current_user.role == UserRole.CLIENT and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client accounts are not permitted to modify attendance records.",
        )

    if attendance_in.roster_id and attendance_in.roster_id != db_attendance.roster_id:
        db_roster = crud_roster.get(db, id=attendance_in.roster_id)
        if not db_roster:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target shift roster not found.",
            )
        existing = crud_attendance.get_by_roster_id(db, roster_id=attendance_in.roster_id)
        if existing and existing.id != attendance_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already exists for that roster.",
            )
    return crud_attendance.update(db, db_obj=db_attendance, obj_in=attendance_in)


@router.delete("/{attendance_id}", response_model=AttendanceResponse)
def delete_attendance(
    *,
    db: Session = Depends(get_db),
    attendance_id: int,
    current_user: User = Depends(require_admin),
) -> AttendanceResponse:
    """Delete an attendance record (Admin only)."""
    db_attendance = crud_attendance.get(db, id=attendance_id)
    if not db_attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found.",
        )
    return crud_attendance.remove(db, id=attendance_id)
