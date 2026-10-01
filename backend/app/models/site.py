from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Text, JSON, Numeric
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Site(BaseModel):
    """
    Represents a physical deployment location (facility) for Fortellus.

    Fields added in Phase 3:
      - contract_rate_security      : Per-day billing rate for Security vertical
      - contract_rate_housekeeping  : Per-day billing rate for Housekeeping vertical
      - contract_rate_nursing       : Per-day billing rate for Nursing/Healthcare vertical
      - required_security           : Headcount requirement for Security vertical
      - required_housekeeping       : Headcount requirement for Housekeeping vertical
      - required_nursing            : Headcount requirement for Nursing vertical

    Fields stubbed for Phase 4 (GPS Geofencing):
      - latitude, longitude : Site centre-point co-ordinates
      - geofence_radius_m   : Allowed check-in radius in metres (default 100)
    """
    __tablename__ = "sites"

    # ── Ownership ─────────────────────────────────────────────────────────────
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)

    # ── Identity ──────────────────────────────────────────────────────────────
    site_name = Column(String(255), index=True, nullable=False)
    site_code = Column(String(50), unique=True, index=True, nullable=True)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    contact_phone = Column(String(50), nullable=True)

    # ── Legacy shift requirements (kept for backward-compat) ──────────────────
    # JSON: {"day_shift_guards": 2, "night_shift_guards": 2, "supervisor_required": true}
    shift_requirements = Column(JSON, default=dict, nullable=False)

    # ── Per-Vertical Headcount Requirements (Phase 3) ─────────────────────────
    required_security = Column(Integer, default=0, nullable=False)
    required_housekeeping = Column(Integer, default=0, nullable=False)
    required_nursing = Column(Integer, default=0, nullable=False)

    # ── Per-Vertical Contract Billing Rates, INR/day/person (Phase 3) ─────────
    contract_rate_security = Column(Numeric(10, 2), default=0, nullable=True)
    contract_rate_housekeeping = Column(Numeric(10, 2), default=0, nullable=True)
    contract_rate_nursing = Column(Numeric(10, 2), default=0, nullable=True)

    # ── GPS Co-ordinates stubbed for Phase 4 Geofencing ──────────────────────
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)
    geofence_radius_m = Column(Integer, default=100, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    client = relationship("Client", back_populates="sites")
    rosters = relationship("ShiftRoster", back_populates="site", cascade="all, delete-orphan")

    # ── Helpers ───────────────────────────────────────────────────────────────
    @property
    def total_required(self) -> int:
        """Total headcount required across all three verticals."""
        return self.required_security + self.required_housekeeping + self.required_nursing

    def shortfall_index(
        self,
        deployed_security: int = 0,
        deployed_housekeeping: int = 0,
        deployed_nursing: int = 0,
    ) -> float:
        """
        Gs = 1 - N_active / N_required   (per site, across all verticals).
        Returns 0.0 when fully staffed, 1.0 when completely unstaffed.
        """
        total_req = self.total_required
        if total_req == 0:
            return 0.0
        total_deployed = deployed_security + deployed_housekeeping + deployed_nursing
        return round(1.0 - min(total_deployed, total_req) / total_req, 4)

    def __repr__(self) -> str:
        return f"<Site(id={self.id}, site_name='{self.site_name}', client_id={self.client_id})>"
