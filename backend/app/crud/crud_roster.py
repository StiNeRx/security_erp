from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.roster import ShiftRoster
from app.models.enums import ShiftType, RosterStatus
from app.schemas.roster import ShiftRosterCreate, ShiftRosterUpdate


class CRUDShiftRoster(CRUDBase[ShiftRoster, ShiftRosterCreate, ShiftRosterUpdate]):
    def get_by_guard_date_shift(
        self,
        db: Session,
        *,
        guard_id: int,
        roster_date: date,
        shift_type: ShiftType,
    ) -> Optional[ShiftRoster]:
        return (
            db.query(ShiftRoster)
            .filter(
                ShiftRoster.guard_id == guard_id,
                ShiftRoster.date == roster_date,
                ShiftRoster.shift_type == shift_type,
            )
            .first()
        )

    def get_site_roster(
        self,
        db: Session,
        *,
        site_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ShiftRoster]:
        query = db.query(ShiftRoster).filter(ShiftRoster.site_id == site_id)
        if start_date:
            query = query.filter(ShiftRoster.date >= start_date)
        if end_date:
            query = query.filter(ShiftRoster.date <= end_date)
        return query.order_by(ShiftRoster.date.desc()).offset(skip).limit(limit).all()

    def get_guard_roster(
        self,
        db: Session,
        *,
        guard_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ShiftRoster]:
        query = db.query(ShiftRoster).filter(ShiftRoster.guard_id == guard_id)
        if start_date:
            query = query.filter(ShiftRoster.date >= start_date)
        if end_date:
            query = query.filter(ShiftRoster.date <= end_date)
        return query.order_by(ShiftRoster.date.desc()).offset(skip).limit(limit).all()


roster = CRUDShiftRoster(ShiftRoster)
