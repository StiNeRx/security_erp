from sqlalchemy import Column, Integer, ForeignKey, DateTime, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import AttendanceStatus


class Attendance(BaseModel):
    __tablename__ = "attendances"

    roster_id = Column(
        Integer,
        ForeignKey("shift_rosters.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    status = Column(
        SQLEnum(AttendanceStatus, name="attendance_status_enum", native_enum=True),
        default=AttendanceStatus.PRESENT,
        nullable=False,
        index=True,
    )
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    overtime_hours = Column(Numeric(4, 2), default=0.00, nullable=False)
    remarks = Column(Text, nullable=True)

    # Relationships
    roster = relationship("ShiftRoster", back_populates="attendance")

    def __repr__(self) -> str:
        return f"<Attendance(id={self.id}, roster_id={self.roster_id}, status='{self.status}', overtime={self.overtime_hours})>"
