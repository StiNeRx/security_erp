import random
from datetime import datetime, timezone, date
from typing import Optional, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.recruitment import Candidate
from app.models.guard import GuardProfile
from app.models.user import User
from app.models.enums import CandidateStatus, UserRole, GuardStatus
from app.schemas.recruitment import CandidateCreate, CandidateUpdate, CandidateOnboardRequest
from app.core.security import get_password_hash


def generate_intimation_id(db: Session) -> str:
    """Generate unique Intimation ID: INT-2026-XXXX."""
    current_year = datetime.now().year
    while True:
        num = random.randint(1000, 9999)
        intimation_id = f"INT-{current_year}-{num}"
        existing = db.query(Candidate).filter(Candidate.intimation_id == intimation_id).first()
        if not existing:
            return intimation_id


class CRUDCandidate(CRUDBase[Candidate, CandidateCreate, CandidateUpdate]):
    def create(self, db: Session, *, obj_in: CandidateCreate) -> Candidate:
        intimation_id = generate_intimation_id(db)
        db_obj = Candidate(
            intimation_id=intimation_id,
            full_name=obj_in.full_name,
            email=obj_in.email,
            phone=obj_in.phone,
            dob=obj_in.dob,
            gender=obj_in.gender,
            address=obj_in.address,
            vertical=obj_in.vertical,
            category=obj_in.category,
            status=obj_in.status,
            screening_notes=obj_in.screening_notes,
            documents=obj_in.documents or {},
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_intimation(self, db: Session, *, intimation_id: str) -> Optional[Candidate]:
        return db.query(Candidate).filter(Candidate.intimation_id == intimation_id).first()

    def get_by_status(
        self, db: Session, *, status: CandidateStatus, skip: int = 0, limit: int = 100
    ) -> List[Candidate]:
        return (
            db.query(Candidate)
            .filter(Candidate.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def onboard_candidate(
        self, db: Session, *, candidate: Candidate, onboard_in: CandidateOnboardRequest
    ) -> GuardProfile:
        """
        Automates candidate onboarding transition:
        1. Creates or resolves a User account.
        2. Creates an active GuardProfile / StaffProfile record with Intimation ID.
        3. Runs automated Bench Lock evaluation on document expiry rules.
        4. Updates candidate status to ONBOARDED and binds guard_profile_id.
        """
        # Resolve badge number
        badge = onboard_in.badge_number
        if not badge:
            badge = f"FORT-{random.randint(1000, 9999)}"

        # 1. Resolve or create user account
        user_email = candidate.email or f"{candidate.phone}@fortellus.internal"
        existing_user = db.query(User).filter(User.email == user_email).first()
        if not existing_user:
            user = User(
                email=user_email,
                hashed_password=get_password_hash("auth0000"),
                full_name=candidate.full_name,
                phone_number=candidate.phone,
                role=UserRole.STAFF,
                is_active=True,
                is_superuser=False,
            )
            db.add(user)
            db.flush()
        else:
            user = existing_user

        # 2. Create Guard / Staff Profile
        profile = GuardProfile(
            user_id=user.id,
            badge_number=badge,
            intimation_id=candidate.intimation_id,
            vertical=candidate.vertical,
            category=candidate.category,
            status=GuardStatus.ACTIVE,
            daily_rate=onboard_in.daily_rate,
            joining_date=onboard_in.joining_date or date.today(),
            emergency_contact=candidate.phone,
            present_address=candidate.address,
            aadhaar_number=onboard_in.aadhaar_number,
            pan_number=onboard_in.pan_number,
            bank_account_no=onboard_in.bank_account_no,
            bank_name=onboard_in.bank_name,
            bank_ifsc=onboard_in.bank_ifsc,
            police_verification_expiry=onboard_in.police_verification_expiry,
            medical_fitness_expiry=onboard_in.medical_fitness_expiry,
        )

        # 3. Automated Bench Lock check: if compliance expired/missing, locks to BENCH
        profile.evaluate_bench_lock()

        db.add(profile)
        db.flush()

        # 4. Mark candidate as ONBOARDED
        candidate.status = CandidateStatus.ONBOARDED
        candidate.onboarded_at = datetime.now(timezone.utc)
        candidate.guard_profile_id = profile.id

        db.commit()
        db.refresh(profile)
        db.refresh(candidate)
        return profile


candidate = CRUDCandidate(Candidate)
