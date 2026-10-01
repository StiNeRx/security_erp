from datetime import datetime
from decimal import Decimal
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
    contact_phone: Optional[str] = None
    shift_requirements: Dict[str, Any] = Field(
        default_factory=lambda: {"day_shift_guards": 1, "night_shift_guards": 1}
    )
    is_active: bool = True
    # Per-vertical headcount requirements (Phase 3)
    required_security: int = Field(default=0, ge=0)
    required_housekeeping: int = Field(default=0, ge=0)
    required_nursing: int = Field(default=0, ge=0)
    # Per-vertical billing rates INR/day/person (Phase 3)
    contract_rate_security: Optional[Decimal] = Field(default=None, ge=0)
    contract_rate_housekeeping: Optional[Decimal] = Field(default=None, ge=0)
    contract_rate_nursing: Optional[Decimal] = Field(default=None, ge=0)
    # GPS for Phase 4 geofencing (stubbed)
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    geofence_radius_m: int = Field(default=100, ge=10, le=5000)


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
    contact_phone: Optional[str] = None
    shift_requirements: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    required_security: Optional[int] = Field(default=None, ge=0)
    required_housekeeping: Optional[int] = Field(default=None, ge=0)
    required_nursing: Optional[int] = Field(default=None, ge=0)
    contract_rate_security: Optional[Decimal] = Field(default=None, ge=0)
    contract_rate_housekeeping: Optional[Decimal] = Field(default=None, ge=0)
    contract_rate_nursing: Optional[Decimal] = Field(default=None, ge=0)
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    geofence_radius_m: Optional[int] = Field(default=None, ge=10, le=5000)


class SiteResponse(SiteBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShortfallIndexResponse(BaseModel):
    """Response model for the GET /sites/{site_id}/shortfall endpoint."""
    site_id: int
    site_name: str
    required: Dict[str, int]
    deployed: Dict[str, int]
    shortfall: Dict[str, int]
    Gs: float = Field(..., description="Shortfall Index: 0 = fully staffed, 1 = completely unstaffed")
    available_bench: list[int] = Field(default_factory=list, description="Guard IDs available from BENCH pool")
