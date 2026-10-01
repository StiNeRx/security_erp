import math
from typing import Optional
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Numeric, Text, Boolean, String, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import AttendanceStatus


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two decimal coordinates on Earth.
    Returns distance in meters.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


class Attendance(BaseModel):
    """
    Represents physical deployment attendance for a scheduled shift roster slot.

    Phase 4 Enhancements:
      - GPS Geofenced Check-In / Check-Out (lat, lng)
      - Server-side Haversine distance verification (R <= 100m)
      - Mobile / Browser Device Binding (device_id, device_name)
      - Automated Shift Overtime Accumulation
    """
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

    # ── Phase 4: GPS Geofence & Location Verification ────────────────────────
    check_in_lat = Column(Numeric(9, 6), nullable=True)
    check_in_lng = Column(Numeric(9, 6), nullable=True)
    check_out_lat = Column(Numeric(9, 6), nullable=True)
    check_out_lng = Column(Numeric(9, 6), nullable=True)

    distance_from_site_m = Column(Numeric(8, 2), nullable=True)
    is_geofence_verified = Column(Boolean, default=False, nullable=False)
    geofence_status = Column(String(50), default="PENDING", nullable=False) # PENDING, VERIFIED, BREACH, OVERRIDE
    geofence_breach_reason = Column(Text, nullable=True)

    # ── Phase 4: Device Binding & Anti-Proxy Security ─────────────────────────
    device_id = Column(String(100), nullable=True, index=True)
    device_name = Column(String(100), nullable=True)
    verified_by_supervisor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    roster = relationship("ShiftRoster", back_populates="attendance")
    verified_by_supervisor = relationship("User", foreign_keys=[verified_by_supervisor_id])

    def calculate_hours_and_overtime(self, standard_shift_hours: float = 12.0) -> tuple[float, float]:
        """
        Calculates total hours worked and overtime hours based on check-in and check-out timestamps.
        Returns (total_worked_hours, overtime_hours).
        """
        if not self.check_in_time or not self.check_out_time:
            return 0.0, 0.0

        diff_seconds = (self.check_out_time - self.check_in_time).total_seconds()
        total_hours = max(0.0, round(diff_seconds / 3600.0, 2))
        ot = max(0.0, round(total_hours - standard_shift_hours, 2))
        self.overtime_hours = ot
        return total_hours, ot

    def verify_geofence(self, site_lat: Optional[float], site_lng: Optional[float], radius_m: int = 100) -> bool:
        """
        Runs server-side Haversine verification against the target site center coordinates.
        """
        if not self.check_in_lat or not self.check_in_lng:
            self.is_geofence_verified = False
            self.geofence_status = "PENDING"
            return False

        if site_lat is None or site_lng is None:
            # If site coordinates are not calibrated, pass with default verified flag
            self.is_geofence_verified = True
            self.geofence_status = "VERIFIED"
            self.distance_from_site_m = 0.0
            return True

        dist = haversine_distance_meters(
            float(self.check_in_lat), float(self.check_in_lng),
            float(site_lat), float(site_lng)
        )
        self.distance_from_site_m = dist

        if dist <= radius_m:
            self.is_geofence_verified = True
            self.geofence_status = "VERIFIED"
            self.geofence_breach_reason = None
            return True
        else:
            self.is_geofence_verified = False
            self.geofence_status = "BREACH"
            self.geofence_breach_reason = (
                f"Check-in location is {dist:.1f}m from site boundary (allowed radius: {radius_m}m)."
            )
            return False

    def __repr__(self) -> str:
        return f"<Attendance(id={self.id}, roster_id={self.roster_id}, status='{self.status}', geofence='{self.geofence_status}', distance={self.distance_from_site_m}m)>"
