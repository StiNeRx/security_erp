from sqlalchemy import Column, String, Integer, ForeignKey, Date, Text, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import ShiftType, RosterStatus


class ShiftRoster(BaseModel):
    __tablename__ = "shift_rosters"

    site_id = Column(
        Integer,
        ForeignKey("sites.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    guard_id = Column(
        Integer,
        ForeignKey("guard_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date = Column(Date, nullable=False, index=True)
    shift_type = Column(
        SQLEnum(ShiftType, name="shift_type_enum", native_enum=True),
        nullable=False,
        index=True,
    )
    status = Column(
        SQLEnum(RosterStatus, name="roster_status_enum", native_enum=True),
        default=RosterStatus.SCHEDULED,
        nullable=False,
        index=True,
    )
    notes = Column(Text, nullable=True)

    # Relationships
    site = relationship("Site", back_populates="rosters")
    guard = relationship("GuardProfile", back_populates="rosters")
    attendance = relationship(
        "Attendance",
        back_populates="roster",
        uselist=False,
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("site_id", "guard_id", "date", "shift_type", name="uq_site_guard_date_shift"),
    )

    def __repr__(self) -> str:
        return f"<ShiftRoster(id={self.id}, site_id={self.site_id}, guard_id={self.guard_id}, date='{self.date}', shift='{self.shift_type}')>"
