import re
from datetime import date
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

# Official 15-digit GSTIN pattern (India)
GSTIN_REGEX = re.compile(
    r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
)


class Client(BaseModel):
    """
    Represents a client organisation contracted with Fortellus.

    Fields added in Phase 3:
      - pan_number          : 10-char PAN (for companies with no GST)
      - contract_start_date : When the current service contract begins
      - contract_end_date   : Expiry date of the service contract
      - contract_terms      : Free-text notes on SLA / scope / clauses
    """
    __tablename__ = "clients"

    # ── Ownership / Identity ──────────────────────────────────────────────────
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    company_name = Column(String(255), unique=True, index=True, nullable=False)
    contact_person = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    billing_address = Column(Text, nullable=False)

    # ── Tax Registration ──────────────────────────────────────────────────────
    gst_number = Column(String(15), nullable=True, index=True)   # 15-char GSTIN
    pan_number = Column(String(10), nullable=True)               # PAN fallback

    # ── Contract Lifecycle ────────────────────────────────────────────────────
    contract_start_date = Column(Date, nullable=True)
    contract_end_date = Column(Date, nullable=True)
    contract_terms = Column(Text, nullable=True)                 # SLA notes / scope

    is_active = Column(Boolean, default=True, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    user = relationship("User", back_populates="client_profile")
    sites = relationship("Site", back_populates="client", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")

    # ── Helpers ───────────────────────────────────────────────────────────────
    @staticmethod
    def validate_gstin(gstin: str) -> bool:
        """Return True if the string matches the 15-digit GSTIN format."""
        return bool(GSTIN_REGEX.match(gstin.strip().upper())) if gstin else True  # optional field

    @property
    def contract_days_remaining(self) -> int | None:
        """Return calendar days until contract_end_date, or None if not set."""
        if self.contract_end_date:
            return (self.contract_end_date - date.today()).days
        return None

    @property
    def is_contract_expired(self) -> bool:
        remaining = self.contract_days_remaining
        return remaining is not None and remaining < 0

    @property
    def is_contract_expiring_soon(self) -> bool:
        """Warn when ≤ 30 days remain."""
        remaining = self.contract_days_remaining
        return remaining is not None and 0 <= remaining <= 30

    def __repr__(self) -> str:
        return f"<Client(id={self.id}, company_name='{self.company_name}')>"
