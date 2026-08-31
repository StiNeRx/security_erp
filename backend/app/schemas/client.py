from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class ClientBase(BaseModel):
    company_name: str
    contact_person: str
    contact_email: EmailStr
    contact_phone: str
    billing_address: str
    gst_number: Optional[str] = None
    is_active: bool = True


class ClientCreate(ClientBase):
    user_id: Optional[int] = None


class ClientUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    billing_address: Optional[str] = None
    gst_number: Optional[str] = None
    user_id: Optional[int] = None
    is_active: Optional[bool] = None


class ClientResponse(ClientBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
