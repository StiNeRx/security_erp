from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import AttendanceStatus


class AttendanceBase(BaseModel):
    roster_id: int
    status: AttendanceStatus = AttendanceStatus.PRESENT
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    overtime_hours: Decimal = Field(default=Decimal("0.00"), ge=0)
    remarks: Optional[str] = None

    # Phase 4 Geofencing & Device Binding
    check_in_lat: Optional[Decimal] = None
    check_in_lng: Optional[Decimal] = None
    check_out_lat: Optional[Decimal] = None
    check_out_lng: Optional[Decimal] = None
    distance_from_site_m: Optional[Decimal] = None
    is_geofence_verified: bool = False
    geofence_status: str = "PENDING"
    geofence_breach_reason: Optional[str] = None
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    verified_by_supervisor_id: Optional[int] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    roster_id: Optional[int] = None
    status: Optional[AttendanceStatus] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    overtime_hours: Optional[Decimal] = Field(default=None, ge=0)
    remarks: Optional[str] = None
    check_in_lat: Optional[Decimal] = None
    check_in_lng: Optional[Decimal] = None
    check_out_lat: Optional[Decimal] = None
    check_out_lng: Optional[Decimal] = None
    distance_from_site_m: Optional[Decimal] = None
    is_geofence_verified: Optional[bool] = None
    geofence_status: Optional[str] = None
    geofence_breach_reason: Optional[str] = None
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    verified_by_supervisor_id: Optional[int] = None


class AttendanceCheckInRequest(BaseModel):
    """Payload sent by mobile/browser officer device during post check-in."""
    roster_id: int
    latitude: Decimal = Field(..., description="GPS Latitude in decimal degrees")
    longitude: Decimal = Field(..., description="GPS Longitude in decimal degrees")
    device_id: str = Field(..., description="Unique browser or mobile device fingerprint")
    device_name: Optional[str] = "Mobile Terminal"
    remarks: Optional[str] = None


class AttendanceCheckOutRequest(BaseModel):
    """Payload sent during post departure / shift handover."""
    roster_id: int
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    device_id: Optional[str] = None
    remarks: Optional[str] = None


class GeofenceOverrideRequest(BaseModel):
    """Supervisor/Admin manual verification of a geofence-breached check-in."""
    reason: str = Field(..., min_length=5, description="Audited operational reason for GPS override")


class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BulkAttendanceItem(BaseModel):
    roster_id: int
    status: AttendanceStatus = AttendanceStatus.PRESENT
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    overtime_hours: Decimal = Field(default=Decimal("0.00"), ge=0)
    remarks: Optional[str] = None
    check_in_lat: Optional[Decimal] = None
    check_in_lng: Optional[Decimal] = None
    distance_from_site_m: Optional[Decimal] = None
    is_geofence_verified: bool = True
    geofence_status: str = "VERIFIED"


class BulkAttendanceRequest(BaseModel):
    site_id: int
    date: date
    attendances: List[BulkAttendanceItem]


class BulkAttendanceResponse(BaseModel):
    site_id: int
    date: date
    total_marked: int
    attendances: List[AttendanceResponse]
