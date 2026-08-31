from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import InvoiceStatus


class InvoiceBase(BaseModel):
    client_id: int
    invoice_number: str
    billing_month: str
    issue_date: date
    due_date: date
    subtotal: Decimal = Field(default=Decimal("0.00"), ge=0)
    tax_rate: Decimal = Field(default=Decimal("18.00"), ge=0)
    tax_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    total_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    status: InvoiceStatus = InvoiceStatus.DRAFT
    notes: Optional[str] = None


class InvoiceCreate(BaseModel):
    client_id: int
    invoice_number: str
    billing_month: str
    issue_date: date
    due_date: date
    subtotal: Decimal = Field(ge=0)
    tax_rate: Decimal = Field(default=Decimal("18.00"), ge=0)
    tax_amount: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    status: InvoiceStatus = InvoiceStatus.DRAFT
    notes: Optional[str] = None


class InvoiceUpdate(BaseModel):
    client_id: Optional[int] = None
    invoice_number: Optional[str] = None
    billing_month: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[Decimal] = Field(default=None, ge=0)
    tax_rate: Optional[Decimal] = Field(default=None, ge=0)
    tax_amount: Optional[Decimal] = Field(default=None, ge=0)
    total_amount: Optional[Decimal] = Field(default=None, ge=0)
    status: Optional[InvoiceStatus] = None
    notes: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShiftBillingBreakdown(BaseModel):
    site_id: int
    site_name: str
    total_shifts: int
    present_shifts: int
    half_day_shifts: int
    absent_shifts: int
    billable_shift_count: Decimal
    total_overtime_hours: Decimal
    billable_amount: Decimal


class GenerateInvoiceRequest(BaseModel):
    client_id: int
    billing_month: str  # Format: "YYYY-MM" e.g. "2026-08"
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    tax_rate: Decimal = Field(default=Decimal("18.00"), ge=0)
    rate_per_shift: Optional[Decimal] = Field(default=None, ge=0)
    overtime_hourly_rate: Optional[Decimal] = Field(default=None, ge=0)
    custom_invoice_number: Optional[str] = None
    notes: Optional[str] = None


class GenerateInvoiceResponse(BaseModel):
    invoice: InvoiceResponse
    client_name: str
    billing_month: str
    total_billable_shifts: Decimal
    total_overtime_hours: Decimal
    breakdown_by_site: List[ShiftBillingBreakdown]
