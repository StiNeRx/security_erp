from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import GuardStatus


class GuardProfileBase(BaseModel):
    badge_number: str
    daily_rate: Decimal = Field(default=Decimal("500.00"), ge=0)
    status: GuardStatus = GuardStatus.ACTIVE
    emergency_contact: Optional[str] = None
    joining_date: Optional[date] = None
    notes: Optional[str] = None


class GuardProfileCreate(GuardProfileBase):
    user_id: int


class GuardProfileUpdate(BaseModel):
    badge_number: Optional[str] = None
    daily_rate: Optional[Decimal] = Field(default=None, ge=0)
    status: Optional[GuardStatus] = None
    emergency_contact: Optional[str] = None
    joining_date: Optional[date] = None
    notes: Optional[str] = None
    user_id: Optional[int] = None


from app.schemas.user import UserResponse


class GuardProfileResponse(GuardProfileBase):
    id: int
    user_id: int
    user: UserResponse
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
