from datetime import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, Date, DateTime, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import CandidateStatus, StaffVertical, StaffCategory


class Candidate(BaseModel):
    """
    Recruitment Pipeline Candidate Pre-Onboarding Model:
    Stages: APPLIED -> VERIFIED -> ONBOARDED.
    Upon reaching ONBOARDED, system automatically creates StaffProfile record,
    assigning the unique Intimation ID and transferring KYC/skill metadata.
    """
    __tablename__ = "recruitment_candidates"

    intimation_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=False)
    dob = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)

    vertical = Column(
        SQLEnum(StaffVertical, name="staff_vertical_recruitment_enum", native_enum=False),
        default=StaffVertical.SECURITY,
        nullable=False,
        index=True,
    )
    category = Column(
        SQLEnum(StaffCategory, name="staff_category_recruitment_enum", native_enum=False),
        default=StaffCategory.GUARD,
        nullable=False,
        index=True,
    )
    status = Column(
        SQLEnum(CandidateStatus, name="candidate_status_enum", native_enum=False),
        default=CandidateStatus.APPLIED,
        nullable=False,
        index=True,
    )

    screening_notes = Column(Text, nullable=True)
    documents = Column(JSON, default=dict, nullable=False)
    onboarded_at = Column(DateTime(timezone=True), nullable=True)

    guard_profile_id = Column(
        Integer,
        ForeignKey("guard_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    guard_profile = relationship("GuardProfile", foreign_keys=[guard_profile_id])

    def __repr__(self) -> str:
        return f"<Candidate(id={self.id}, intimation='{self.intimation_id}', name='{self.full_name}', status='{self.status}')>"
