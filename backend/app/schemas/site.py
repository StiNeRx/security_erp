from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ShiftRequirementsSchema(BaseModel):
    day_shift_guards: int = Field(default=1, ge=0)
    night_shift_guards: int = Field(default=1, ge=0)
    supervisor_required: bool = False
    custom_rules: Optional[Dict[str, Any]] = None


class SiteBase(BaseModel):
    site_name: str
    site_code: Optional[str] = None
    address: str
    city: str
    state: str
    postal_code: str
    shift_requirements: Dict[str, Any] = Field(default_factory=lambda: {"day_shift_guards": 1, "night_shift_guards": 1})
    contact_phone: Optional[str] = None
    is_active: bool = True


class SiteCreate(SiteBase):
    client_id: int


class SiteUpdate(BaseModel):
    client_id: Optional[int] = None
    site_name: Optional[str] = None
    site_code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    shift_requirements: Optional[Dict[str, Any]] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None


class SiteResponse(SiteBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
