from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_hr_or_admin, require_admin
from app.crud.crud_recruitment import candidate as crud_candidate
from app.models.enums import CandidateStatus, StaffVertical
from app.schemas.recruitment import (
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
    CandidateOnboardRequest,
)
from app.schemas.guard import GuardProfileResponse

router = APIRouter()


@router.get("/", response_model=List[CandidateResponse])
def get_candidates(
    db: Session = Depends(get_db),
    status_filter: Optional[CandidateStatus] = None,
    vertical: Optional[StaffVertical] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    _user=Depends(require_hr_or_admin),
):
    """Retrieve recruitment pipeline candidates with optional status/vertical filters."""
    query = crud_candidate.get_multi(db, skip=skip, limit=limit)
    if status_filter:
        query = [c for c in query if c.status == status_filter]
    if vertical:
        query = [c for c in query if c.vertical == vertical]
    return query


@router.post("/", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(
    candidate_in: CandidateCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_hr_or_admin),
):
    """Register initial candidate screening and generate unique Intimation ID."""
    return crud_candidate.create(db, obj_in=candidate_in)


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_hr_or_admin),
):
    """Retrieve candidate dossier by ID."""
    cand = crud_candidate.get(db, id=candidate_id)
    if not cand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found.",
        )
    return cand


@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: int,
    candidate_in: CandidateUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_hr_or_admin),
):
    """Update candidate screening status, notes, or credentials."""
    cand = crud_candidate.get(db, id=candidate_id)
    if not cand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found.",
        )
    return crud_candidate.update(db, db_obj=cand, obj_in=candidate_in)


@router.post("/{candidate_id}/onboard", response_model=GuardProfileResponse)
def onboard_candidate(
    candidate_id: int,
    onboard_in: CandidateOnboardRequest,
    db: Session = Depends(get_db),
    _user=Depends(require_hr_or_admin),
):
    """
    Onboard Candidate:
    1. Transition status to ONBOARDED.
    2. Auto-creates staff master profile with unique Intimation ID.
    3. Runs automated Bench Locking validation against document expiry rules.
    """
    cand = crud_candidate.get(db, id=candidate_id)
    if not cand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found.",
        )
    if cand.status == CandidateStatus.ONBOARDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Candidate {cand.intimation_id} has already been onboarded.",
        )

    profile = crud_candidate.onboard_candidate(db, candidate=cand, onboard_in=onboard_in)
    return profile


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_admin),
):
    """Delete candidate from recruitment pipeline (Admin only)."""
    cand = crud_candidate.get(db, id=candidate_id)
    if not cand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found.",
        )
    crud_candidate.remove(db, id=candidate_id)
