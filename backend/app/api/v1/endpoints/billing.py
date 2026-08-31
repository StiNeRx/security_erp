import calendar
import uuid
from datetime import date, timedelta
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.crud.crud_client import client as crud_client
from app.crud.crud_site import site as crud_site
from app.crud.crud_invoice import invoice as crud_invoice
from app.models.enums import AttendanceStatus, InvoiceStatus, RosterStatus
from app.models.invoice import Invoice
from app.models.roster import ShiftRoster
from app.models.user import User
from app.schemas.invoice import (
    GenerateInvoiceRequest,
    GenerateInvoiceResponse,
    ShiftBillingBreakdown,
)

router = APIRouter()


@router.post("/generate-invoice", response_model=GenerateInvoiceResponse, status_code=status.HTTP_201_CREATED)
def generate_client_invoice(
    *,
    db: Session = Depends(get_db),
    request: GenerateInvoiceRequest,
    current_user: User = Depends(require_admin),
) -> GenerateInvoiceResponse:
    """
    Calculate total billable shifts and overtime for a client over a given billing month,
    compute subtotal, tax (GST), create an Invoice in the database, and return the itemized breakdown.
    """
    # 1. Validate Client
    db_client = crud_client.get(db, id=request.client_id)
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {request.client_id} not found.",
        )

    # 2. Parse billing month (e.g. "2026-08")
    try:
        parts = request.billing_month.strip().split("-")
        year = int(parts[0])
        month = int(parts[1])
        if not (1 <= month <= 12):
            raise ValueError()
        start_date = date(year, month, 1)
        num_days = calendar.monthrange(year, month)[1]
        end_date = date(year, month, num_days)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid billing_month format. Expected 'YYYY-MM' (e.g., '2026-08').",
        )

    # 3. Retrieve all sites for the client
    client_sites = crud_site.get_by_client(db, client_id=request.client_id, skip=0, limit=500)
    
    total_billable_shifts = Decimal("0.00")
    total_overtime_hours = Decimal("0.00")
    subtotal = Decimal("0.00")
    breakdown_list: List[ShiftBillingBreakdown] = []

    # 4. Iterate over sites and compute billable shifts
    for site in client_sites:
        rosters = (
            db.query(ShiftRoster)
            .filter(
                ShiftRoster.site_id == site.id,
                ShiftRoster.date >= start_date,
                ShiftRoster.date <= end_date,
            )
            .all()
        )

        site_total_shifts = len(rosters)
        site_present_shifts = 0
        site_half_day_shifts = 0
        site_absent_shifts = 0
        site_billable_shifts = Decimal("0.00")
        site_ot_hours = Decimal("0.00")
        site_billable_amount = Decimal("0.00")

        for roster in rosters:
            # Default rate calculation
            guard_rate = Decimal("650.00")
            if roster.guard and roster.guard.daily_rate:
                guard_rate = Decimal(str(roster.guard.daily_rate))
            
            shift_rate = (
                Decimal(str(request.rate_per_shift))
                if request.rate_per_shift is not None
                else guard_rate
            )
            ot_rate = (
                Decimal(str(request.overtime_hourly_rate))
                if request.overtime_hourly_rate is not None
                else Decimal("100.00")
            )

            att = roster.attendance
            if att:
                if att.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE]:
                    site_present_shifts += 1
                    factor = Decimal("1.0")
                elif att.status == AttendanceStatus.HALF_DAY:
                    site_half_day_shifts += 1
                    factor = Decimal("0.5")
                elif att.status == AttendanceStatus.ABSENT:
                    site_absent_shifts += 1
                    factor = Decimal("0.0")
                else:
                    site_present_shifts += 1
                    factor = Decimal("1.0")

                ot = Decimal(str(att.overtime_hours or 0.0))
                site_ot_hours += ot
            else:
                # Fallback to roster scheduled status
                if roster.status == RosterStatus.CANCELLED:
                    site_absent_shifts += 1
                    factor = Decimal("0.0")
                elif roster.status == RosterStatus.COMPLETED:
                    site_present_shifts += 1
                    factor = Decimal("1.0")
                else:
                    site_present_shifts += 1
                    factor = Decimal("1.0")
                ot = Decimal("0.00")

            site_billable_shifts += factor
            shift_cost = round(factor * shift_rate, 2)
            ot_cost = round(ot * ot_rate, 2)
            site_billable_amount += (shift_cost + ot_cost)

        total_billable_shifts += site_billable_shifts
        total_overtime_hours += site_ot_hours
        subtotal += site_billable_amount

        breakdown_list.append(
            ShiftBillingBreakdown(
                site_id=site.id,
                site_name=site.site_name,
                total_shifts=site_total_shifts,
                present_shifts=site_present_shifts,
                half_day_shifts=site_half_day_shifts,
                absent_shifts=site_absent_shifts,
                billable_shift_count=site_billable_shifts,
                total_overtime_hours=site_ot_hours,
                billable_amount=round(site_billable_amount, 2),
            )
        )

    # 5. Compute Taxes & Total Amount
    tax_rate = Decimal(str(request.tax_rate))
    tax_amount = round(subtotal * (tax_rate / Decimal("100")), 2)
    total_amount = round(subtotal + tax_amount, 2)

    # 6. Determine Unique Invoice Number
    if request.custom_invoice_number:
        invoice_number = request.custom_invoice_number
        existing = crud_invoice.get_by_invoice_number(db, invoice_number=invoice_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An invoice with invoice_number '{invoice_number}' already exists.",
            )
    else:
        # Standard format: INV-{YYYYMM}-{CLIENT_ID:03d}-{SUFFIX}
        month_str = f"{year:04d}{month:02d}"
        suffix = uuid.uuid4().hex[:4].upper()
        invoice_number = f"INV-{month_str}-{request.client_id:03d}-{suffix}"

    issue_date = request.issue_date or date.today()
    due_date = request.due_date or (issue_date + timedelta(days=15))

    # 7. Create and persist the Invoice
    db_invoice = Invoice(
        client_id=request.client_id,
        invoice_number=invoice_number,
        billing_month=request.billing_month,
        issue_date=issue_date,
        due_date=due_date,
        subtotal=subtotal,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        status=InvoiceStatus.DRAFT,
        notes=request.notes
        or f"Automated billing for {request.billing_month}. Total billable shifts: {total_billable_shifts}.",
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    return GenerateInvoiceResponse(
        invoice=db_invoice,
        client_name=db_client.company_name,
        billing_month=request.billing_month,
        total_billable_shifts=total_billable_shifts,
        total_overtime_hours=total_overtime_hours,
        breakdown_by_site=breakdown_list,
    )
