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


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    roster_id: Optional[int] = None
    status: Optional[AttendanceStatus] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    overtime_hours: Optional[Decimal] = Field(default=None, ge=0)
    remarks: Optional[str] = None


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


class BulkAttendanceRequest(BaseModel):
    site_id: int
    date: date
    attendances: List[BulkAttendanceItem]


class BulkAttendanceResponse(BaseModel):
    site_id: int
    date: date
    total_marked: int
    attendances: List[AttendanceResponse]
