from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import CandidateStatus, StaffVertical, StaffCategory


class CandidateBase(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: str
    dob: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    vertical: StaffVertical = StaffVertical.SECURITY
    category: StaffCategory = StaffCategory.GUARD
    status: CandidateStatus = CandidateStatus.APPLIED
    screening_notes: Optional[str] = None
    documents: Optional[Dict[str, Any]] = Field(default_factory=dict)


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    vertical: Optional[StaffVertical] = None
    category: Optional[StaffCategory] = None
    status: Optional[CandidateStatus] = None
    screening_notes: Optional[str] = None
    documents: Optional[Dict[str, Any]] = None


class CandidateOnboardRequest(BaseModel):
    daily_rate: Decimal = Field(default=Decimal("600.00"), ge=0)
    badge_number: Optional[str] = None
    joining_date: Optional[date] = None
    police_verification_expiry: Optional[date] = None
    medical_fitness_expiry: Optional[date] = None
    bank_account_no: Optional[str] = None
    bank_name: Optional[str] = None
    bank_ifsc: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None


class CandidateResponse(CandidateBase):
    id: int
    intimation_id: str
    guard_profile_id: Optional[int] = None
    onboarded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
