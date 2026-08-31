from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.enums import ShiftType, RosterStatus


class ShiftRosterBase(BaseModel):
    site_id: int
    guard_id: int
    date: date
    shift_type: ShiftType = ShiftType.DAY
    status: RosterStatus = RosterStatus.SCHEDULED
    notes: Optional[str] = None


class ShiftRosterCreate(ShiftRosterBase):
    pass


class ShiftRosterUpdate(BaseModel):
    site_id: Optional[int] = None
    guard_id: Optional[int] = None
    date: Optional[date] = None
    shift_type: Optional[ShiftType] = None
    status: Optional[RosterStatus] = None
    notes: Optional[str] = None


class ShiftRosterResponse(ShiftRosterBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WeeklyRosterAssignmentItem(BaseModel):
    guard_id: int
    date: date
    shift_type: ShiftType = ShiftType.DAY
    notes: Optional[str] = None


class WeeklyRosterAssignRequest(BaseModel):
    site_id: int
    start_date: date
    end_date: Optional[date] = None
    assignments: List[WeeklyRosterAssignmentItem]


class WeeklyRosterAssignResponse(BaseModel):
    site_id: int
    start_date: date
    end_date: date
    total_scheduled: int
    rosters: List[ShiftRosterResponse]
