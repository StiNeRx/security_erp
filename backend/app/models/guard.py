from sqlalchemy import Column, String, Integer, ForeignKey, Numeric, Date, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import GuardStatus


class GuardProfile(BaseModel):
    __tablename__ = "guard_profiles"

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    badge_number = Column(String(50), unique=True, index=True, nullable=False)
    daily_rate = Column(Numeric(10, 2), nullable=False, default=0.00)
    status = Column(
        SQLEnum(GuardStatus, name="guard_status_enum", native_enum=True),
        default=GuardStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    emergency_contact = Column(String(100), nullable=True)
    joining_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="guard_profile")
    rosters = relationship("ShiftRoster", back_populates="guard", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<GuardProfile(id={self.id}, badge='{self.badge_number}', user_id={self.user_id})>"
