from typing import Optional, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.attendance import Attendance
from app.models.enums import AttendanceStatus
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate


class CRUDAttendance(CRUDBase[Attendance, AttendanceCreate, AttendanceUpdate]):
    def get_by_roster_id(self, db: Session, *, roster_id: int) -> Optional[Attendance]:
        return (
            db.query(Attendance)
            .filter(Attendance.roster_id == roster_id)
            .first()
        )

    def get_by_status(
        self, db: Session, *, status: AttendanceStatus, skip: int = 0, limit: int = 100
    ) -> List[Attendance]:
        return (
            db.query(Attendance)
            .filter(Attendance.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )


attendance = CRUDAttendance(Attendance)
