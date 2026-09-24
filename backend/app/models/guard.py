from datetime import date
from sqlalchemy import Column, String, Integer, ForeignKey, Numeric, Date as SQLDate, Text, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import GuardStatus, StaffVertical, StaffCategory


class GuardProfile(BaseModel):
    """
    Unified Staff Profile Model supporting Fortellus multi-vertical operations:
    Security Services, Housekeeping Operations, and Healthcare/Nursing Personnel.
    Includes full statutory compliance, KYC, arms tracking, Uniform EMI,
    and automated Bench locking.
    """
    __tablename__ = "guard_profiles"

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    badge_number = Column(String(50), unique=True, index=True, nullable=False)
    intimation_id = Column(String(50), unique=True, index=True, nullable=True)

    # Multi-Vertical Staffing
    vertical = Column(
        SQLEnum(StaffVertical, name="staff_vertical_enum", native_enum=False),
        default=StaffVertical.SECURITY,
        nullable=False,
        index=True,
    )
    category = Column(
        SQLEnum(StaffCategory, name="staff_category_enum", native_enum=False),
        default=StaffCategory.GUARD,
        nullable=False,
        index=True,
    )
    status = Column(
        SQLEnum(GuardStatus, name="guard_status_enum", native_enum=False),
        default=GuardStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    daily_rate = Column(Numeric(10, 2), nullable=False, default=0.00)
    emergency_contact = Column(String(100), nullable=True)
    joining_date = Column(SQLDate, nullable=True)
    notes = Column(Text, nullable=True)

    # Personal & KYC Details
    aadhaar_number = Column(String(20), nullable=True)  # Masked or 12-digit format
    pan_number = Column(String(20), nullable=True)
    permanent_address = Column(Text, nullable=True)
    present_address = Column(Text, nullable=True)
    marital_status = Column(String(20), nullable=True)

    # Bank Account Setup
    bank_account_no = Column(String(50), nullable=True)
    bank_name = Column(String(100), nullable=True)
    bank_branch = Column(String(100), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)

    # Nominee Details
    nominee_name = Column(String(100), nullable=True)
    nominee_relation = Column(String(50), nullable=True)
    nominee_dob = Column(SQLDate, nullable=True)
    nominee_aadhaar = Column(String(20), nullable=True)
    nominee_allocation_pct = Column(Numeric(5, 2), nullable=True, default=100.00)

    # Arms Details (Mandatory for Gunman category)
    arms_license_no = Column(String(50), nullable=True)
    arms_issuing_authority = Column(String(100), nullable=True)
    arms_caliber = Column(String(50), nullable=True)
    arms_weapon_serial = Column(String(50), nullable=True)
    arms_ammunition_count = Column(Integer, nullable=True, default=0)
    arms_expiry_date = Column(SQLDate, nullable=True)

    # Uniform & Dress EMI Calculator
    uniform_issued_items = Column(JSON, default=list, nullable=True)  # ["Shirt", "Trousers", "Shoes", "Belt", "Cap"]
    uniform_total_cost = Column(Numeric(10, 2), default=0.00, nullable=False)
    uniform_monthly_emi = Column(Numeric(10, 2), default=0.00, nullable=False)
    uniform_balance_due = Column(Numeric(10, 2), default=0.00, nullable=False)

    # Compliance & Document Expiries
    police_verification_report_url = Column(String(500), nullable=True)
    police_verification_station = Column(String(100), nullable=True)
    police_verification_expiry = Column(SQLDate, nullable=True)

    medical_report_url = Column(String(500), nullable=True)
    medical_fitness_status = Column(String(50), nullable=True)  # "FIT", "UNFIT", "PENDING"
    medical_examination_date = Column(SQLDate, nullable=True)
    medical_fitness_expiry = Column(SQLDate, nullable=True)

    psara_cert_no = Column(String(50), nullable=True)
    psara_batch_no = Column(String(50), nullable=True)
    psara_skill_level = Column(String(50), nullable=True)

    form11_url = Column(String(500), nullable=True)
    passbook_copy_url = Column(String(500), nullable=True)
    gun_license_doc_url = Column(String(500), nullable=True)

    # Automated Bench Locking
    is_bench_locked = Column(Boolean, default=False, nullable=False)
    bench_lock_reason = Column(String(255), nullable=True)

    # Relationships
    user = relationship("User", back_populates="guard_profile")
    rosters = relationship("ShiftRoster", back_populates="guard", cascade="all, delete-orphan")

    def evaluate_bench_lock(self) -> None:
        """
        Evaluates document validity against deployment rules:
        - If Police Verification is expired or missing -> Lock to BENCH.
        - If Medical Fitness is expired -> Lock to BENCH.
        - If Gunman and Gun License is expired -> Lock to BENCH.
        """
        today = date.today()
        reasons = []

        if not self.police_verification_expiry or self.police_verification_expiry < today:
            reasons.append("Police verification missing or expired")

        if self.medical_fitness_expiry and self.medical_fitness_expiry < today:
            reasons.append("Medical fitness expired")

        if self.category == StaffCategory.GUNMAN:
            if not self.arms_expiry_date or self.arms_expiry_date < today:
                reasons.append("Gun license missing or expired")

        if reasons:
            self.is_bench_locked = True
            self.bench_lock_reason = "; ".join(reasons)
            if self.status != GuardStatus.TERMINATED:
                self.status = GuardStatus.BENCH
        else:
            self.is_bench_locked = False
            self.bench_lock_reason = None

    def __repr__(self) -> str:
        return f"<GuardProfile(id={self.id}, badge='{self.badge_number}', vertical='{self.vertical}', status='{self.status}', bench_locked={self.is_bench_locked})>"
