from datetime import date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_admin, require_hr_or_admin
from app.core.database import get_db
from app.crud.crud_guard import guard as crud_guard
from app.crud.crud_user import user as crud_user
from app.crud.crud_roster import roster as crud_roster
from app.models.guard import GuardProfile
from app.models.enums import GuardStatus, StaffVertical, StaffCategory, UserRole
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
    vertical: Optional[StaffVertical] = None,
    category: Optional[StaffCategory] = None,
    bench_locked_only: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
) -> List[GuardProfileResponse]:
    """Retrieve security/staff profiles. Supports vertical, category, status, and bench-lock filters."""
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

    # Admin / HR / Operations query
    query = db.query(GuardProfile)
    if status:
        query = query.filter(GuardProfile.status == status)
    if vertical:
        query = query.filter(GuardProfile.vertical == vertical)
    if category:
        query = query.filter(GuardProfile.category == category)
    if bench_locked_only is not None:
        query = query.filter(GuardProfile.is_bench_locked == bench_locked_only)

    return query.offset(skip).limit(limit).all()


@router.get("/compliance/expiries", response_model=Dict[str, Any])
def get_compliance_expiries(
    db: Session = Depends(get_db),
    days_ahead: int = Query(60, ge=1, le=180),
    current_user: User = Depends(require_hr_or_admin),
) -> Dict[str, Any]:
    """
    Compliance Expiry Summary Report:
    Scans all staff compliance records and flags documents expiring within 30/45/60 days or already expired.
    """
    today = date.today()
    threshold = today + timedelta(days=days_ahead)

    all_staff = db.query(GuardProfile).filter(GuardProfile.status != GuardStatus.TERMINATED).all()

    expired_list = []
    expiring_soon_list = []

    for staff in all_staff:
        # Check Police Verification
        if staff.police_verification_expiry:
            if staff.police_verification_expiry < today:
                expired_list.append({
                    "staff_id": staff.id,
                    "badge_number": staff.badge_number,
                    "intimation_id": staff.intimation_id,
                    "document_type": "Police Verification",
                    "expiry_date": staff.police_verification_expiry.isoformat(),
                    "days_remaining": (staff.police_verification_expiry - today).days,
                    "status": "EXPIRED",
                })
            elif staff.police_verification_expiry <= threshold:
                expiring_soon_list.append({
                    "staff_id": staff.id,
                    "badge_number": staff.badge_number,
                    "intimation_id": staff.intimation_id,
                    "document_type": "Police Verification",
                    "expiry_date": staff.police_verification_expiry.isoformat(),
                    "days_remaining": (staff.police_verification_expiry - today).days,
                    "status": "EXPIRING_SOON",
                })
        else:
            expired_list.append({
                "staff_id": staff.id,
                "badge_number": staff.badge_number,
                "intimation_id": staff.intimation_id,
                "document_type": "Police Verification",
                "expiry_date": None,
                "days_remaining": -999,
                "status": "MISSING",
            })

        # Check Gun License (for gunmen)
        if staff.category == StaffCategory.GUNMAN:
            if staff.arms_expiry_date:
                if staff.arms_expiry_date < today:
                    expired_list.append({
                        "staff_id": staff.id,
                        "badge_number": staff.badge_number,
                        "intimation_id": staff.intimation_id,
                        "document_type": "Gun License",
                        "expiry_date": staff.arms_expiry_date.isoformat(),
                        "days_remaining": (staff.arms_expiry_date - today).days,
                        "status": "EXPIRED",
                    })
                elif staff.arms_expiry_date <= threshold:
                    expiring_soon_list.append({
                        "staff_id": staff.id,
                        "badge_number": staff.badge_number,
                        "intimation_id": staff.intimation_id,
                        "document_type": "Gun License",
                        "expiry_date": staff.arms_expiry_date.isoformat(),
                        "days_remaining": (staff.arms_expiry_date - today).days,
                        "status": "EXPIRING_SOON",
                    })

    return {
        "scanned_staff_count": len(all_staff),
        "expired_count": len(expired_list),
        "expiring_soon_count": len(expiring_soon_list),
        "expired": expired_list,
        "expiring_soon": expiring_soon_list,
    }


@router.post("/compliance/evaluate-bench-locks", response_model=Dict[str, Any])
def trigger_bench_locks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin),
) -> Dict[str, Any]:
    """
    Automated System Evaluation:
    Evaluates all staff against statutory compliance rules.
    Locks profiles with missing/expired Police Verification or Medicals to BENCH status.
    """
    all_staff = db.query(GuardProfile).filter(GuardProfile.status != GuardStatus.TERMINATED).all()
    locked_count = 0
    unlocked_count = 0

    for staff in all_staff:
        prev_locked = staff.is_bench_locked
        staff.evaluate_bench_lock()
        if staff.is_bench_locked and not prev_locked:
            locked_count += 1
        elif not staff.is_bench_locked and prev_locked:
            unlocked_count += 1

    db.commit()
    return {
        "status": "completed",
        "total_evaluated": len(all_staff),
        "newly_locked_to_bench": locked_count,
        "unlocked_to_active": unlocked_count,
    }


@router.post("/", response_model=GuardProfileResponse, status_code=http_status.HTTP_201_CREATED)
def create_guard(
    *,
    db: Session = Depends(get_db),
    guard_in: GuardProfileCreate,
    current_user: User = Depends(require_hr_or_admin),
) -> GuardProfileResponse:
    """Create a new staff profile attached to a User (HR / Admin)."""
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

    profile = crud_guard.create(db, obj_in=guard_in)
    profile.evaluate_bench_lock()
    db.commit()
    db.refresh(profile)
    return profile


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
    current_user: User = Depends(require_hr_or_admin),
) -> GuardProfileResponse:
    """Update guard profile (Admin / HR). Re-evaluates bench lock criteria."""
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

    updated = crud_guard.update(db, db_obj=db_guard, obj_in=guard_in)
    updated.evaluate_bench_lock()
    db.commit()
    db.refresh(updated)
    return updated


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
