from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.enums import GuardStatus, StaffVertical, StaffCategory
from app.schemas.user import UserResponse


class GuardProfileBase(BaseModel):
    badge_number: str
    intimation_id: Optional[str] = None
    vertical: StaffVertical = StaffVertical.SECURITY
    category: StaffCategory = StaffCategory.GUARD
    status: GuardStatus = GuardStatus.ACTIVE
    daily_rate: Decimal = Field(default=Decimal("500.00"), ge=0)
    emergency_contact: Optional[str] = None
    joining_date: Optional[date] = None
    notes: Optional[str] = None

    # KYC Details
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    permanent_address: Optional[str] = None
    present_address: Optional[str] = None
    marital_status: Optional[str] = None

    # Bank Account
    bank_account_no: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_ifsc: Optional[str] = None

    # Nominee
    nominee_name: Optional[str] = None
    nominee_relation: Optional[str] = None
    nominee_dob: Optional[date] = None
    nominee_aadhaar: Optional[str] = None
    nominee_allocation_pct: Optional[Decimal] = Decimal("100.00")

    # Arms Details (Gunman)
    arms_license_no: Optional[str] = None
    arms_issuing_authority: Optional[str] = None
    arms_caliber: Optional[str] = None
    arms_weapon_serial: Optional[str] = None
    arms_ammunition_count: Optional[int] = 0
    arms_expiry_date: Optional[date] = None

    # Uniform & Dress EMI
    uniform_issued_items: Optional[List[str]] = Field(default_factory=list)
    uniform_total_cost: Decimal = Field(default=Decimal("0.00"), ge=0)
    uniform_monthly_emi: Decimal = Field(default=Decimal("0.00"), ge=0)
    uniform_balance_due: Decimal = Field(default=Decimal("0.00"), ge=0)

    # Compliance & Expiry
    police_verification_report_url: Optional[str] = None
    police_verification_station: Optional[str] = None
    police_verification_expiry: Optional[date] = None

    medical_report_url: Optional[str] = None
    medical_fitness_status: Optional[str] = "FIT"
    medical_examination_date: Optional[date] = None
    medical_fitness_expiry: Optional[date] = None

    psara_cert_no: Optional[str] = None
    psara_batch_no: Optional[str] = None
    psara_skill_level: Optional[str] = None

    form11_url: Optional[str] = None
    passbook_copy_url: Optional[str] = None
    gun_license_doc_url: Optional[str] = None

    # Bench Lock
    is_bench_locked: bool = False
    bench_lock_reason: Optional[str] = None

    @field_validator("aadhaar_number", mode="before")
    @classmethod
    def validate_aadhaar(cls, v: Any) -> Optional[str]:
        if not v:
            return None
        clean = str(v).replace(" ", "").replace("-", "")
        if clean and not (clean.isdigit() and len(clean) == 12):
            # Keep value but allow formatted or masked string
            pass
        return clean


class GuardProfileCreate(GuardProfileBase):
    user_id: int


class GuardProfileUpdate(BaseModel):
    badge_number: Optional[str] = None
    intimation_id: Optional[str] = None
    vertical: Optional[StaffVertical] = None
    category: Optional[StaffCategory] = None
    status: Optional[GuardStatus] = None
    daily_rate: Optional[Decimal] = Field(default=None, ge=0)
    emergency_contact: Optional[str] = None
    joining_date: Optional[date] = None
    notes: Optional[str] = None

    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    permanent_address: Optional[str] = None
    present_address: Optional[str] = None
    marital_status: Optional[str] = None

    bank_account_no: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_ifsc: Optional[str] = None

    nominee_name: Optional[str] = None
    nominee_relation: Optional[str] = None
    nominee_dob: Optional[date] = None
    nominee_aadhaar: Optional[str] = None
    nominee_allocation_pct: Optional[Decimal] = None

    arms_license_no: Optional[str] = None
    arms_issuing_authority: Optional[str] = None
    arms_caliber: Optional[str] = None
    arms_weapon_serial: Optional[str] = None
    arms_ammunition_count: Optional[int] = None
    arms_expiry_date: Optional[date] = None

    uniform_issued_items: Optional[List[str]] = None
    uniform_total_cost: Optional[Decimal] = None
    uniform_monthly_emi: Optional[Decimal] = None
    uniform_balance_due: Optional[Decimal] = None

    police_verification_report_url: Optional[str] = None
    police_verification_station: Optional[str] = None
    police_verification_expiry: Optional[date] = None

    medical_report_url: Optional[str] = None
    medical_fitness_status: Optional[str] = None
    medical_examination_date: Optional[date] = None
    medical_fitness_expiry: Optional[date] = None

    psara_cert_no: Optional[str] = None
    psara_batch_no: Optional[str] = None
    psara_skill_level: Optional[str] = None

    form11_url: Optional[str] = None
    passbook_copy_url: Optional[str] = None
    gun_license_doc_url: Optional[str] = None

    is_bench_locked: Optional[bool] = None
    bench_lock_reason: Optional[str] = None
    user_id: Optional[int] = None


class GuardProfileResponse(GuardProfileBase):
    id: int
    user_id: int
    user: Optional[UserResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
