from typing import Optional, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.guard import GuardProfile
from app.models.enums import GuardStatus
from app.schemas.guard import GuardProfileCreate, GuardProfileUpdate


class CRUDGuardProfile(CRUDBase[GuardProfile, GuardProfileCreate, GuardProfileUpdate]):
    def get_by_badge(self, db: Session, *, badge_number: str) -> Optional[GuardProfile]:
        return (
            db.query(GuardProfile)
            .filter(GuardProfile.badge_number == badge_number)
            .first()
        )

    def get_by_user_id(self, db: Session, *, user_id: int) -> Optional[GuardProfile]:
        return db.query(GuardProfile).filter(GuardProfile.user_id == user_id).first()

    def get_by_status(
        self, db: Session, *, status: GuardStatus, skip: int = 0, limit: int = 100
    ) -> List[GuardProfile]:
        return (
            db.query(GuardProfile)
            .filter(GuardProfile.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )


guard = CRUDGuardProfile(GuardProfile)
