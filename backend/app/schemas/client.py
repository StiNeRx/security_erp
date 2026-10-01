import re
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator

# 15-digit GSTIN regex (mirrors the model-level constant)
_GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
# 10-char PAN regex
_PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")


class ClientBase(BaseModel):
    company_name: str
    contact_person: str
    contact_email: EmailStr
    contact_phone: str
    billing_address: str
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    # Contract lifecycle
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    contract_terms: Optional[str] = None
    is_active: bool = True

    @field_validator("gst_number")
    @classmethod
    def validate_gstin(cls, v: Optional[str]) -> Optional[str]:
        """Enforce 15-digit GSTIN format when provided."""
        if v is None or v.strip() == "":
            return None
        normalised = v.strip().upper()
        if not _GSTIN_RE.match(normalised):
            raise ValueError(
                "Invalid GSTIN. Must be 15 characters: "
                "2-digit state code + 10-char PAN + 1 entity + 'Z' + 1 checksum. "
                f"Got: '{v}'"
            )
        return normalised

    @field_validator("pan_number")
    @classmethod
    def validate_pan(cls, v: Optional[str]) -> Optional[str]:
        """Enforce 10-char PAN format when provided."""
        if v is None or v.strip() == "":
            return None
        normalised = v.strip().upper()
        if not _PAN_RE.match(normalised):
            raise ValueError(
                f"Invalid PAN. Must match AAAAA9999A pattern. Got: '{v}'"
            )
        return normalised

    @field_validator("contract_end_date")
    @classmethod
    def end_after_start(cls, v: Optional[date], info) -> Optional[date]:
        """contract_end_date must be after contract_start_date when both are provided."""
        start = info.data.get("contract_start_date")
        if v and start and v < start:
            raise ValueError("contract_end_date must be on or after contract_start_date.")
        return v


class ClientCreate(ClientBase):
    user_id: Optional[int] = None


class ClientUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    billing_address: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    contract_terms: Optional[str] = None
    user_id: Optional[int] = None
    is_active: Optional[bool] = None

    @field_validator("gst_number")
    @classmethod
    def validate_gstin(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        normalised = v.strip().upper()
        if not _GSTIN_RE.match(normalised):
            raise ValueError(f"Invalid GSTIN format. Got: '{v}'")
        return normalised


class ClientResponse(ClientBase):
    id: int
    user_id: Optional[int] = None
    # Computed helpers (populated via @property on model)
    contract_days_remaining: Optional[int] = None
    is_contract_expired: bool = False
    is_contract_expiring_soon: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
