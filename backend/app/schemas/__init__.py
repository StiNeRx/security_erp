"""Pydantic schemas registry."""
from app.schemas.user import UserBase, UserCreate, UserUpdate, UserResponse
from app.schemas.token import Token, TokenPayload, LoginRequest
from app.schemas.client import ClientBase, ClientCreate, ClientUpdate, ClientResponse
from app.schemas.site import SiteBase, SiteCreate, SiteUpdate, SiteResponse, ShiftRequirementsSchema
from app.schemas.guard import (
    GuardProfileBase,
    GuardProfileCreate,
    GuardProfileUpdate,
    GuardProfileResponse,
)
from app.schemas.roster import (
    ShiftRosterBase,
    ShiftRosterCreate,
    ShiftRosterUpdate,
    ShiftRosterResponse,
    WeeklyRosterAssignmentItem,
    WeeklyRosterAssignRequest,
    WeeklyRosterAssignResponse,
)
from app.schemas.attendance import (
    AttendanceBase,
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse,
    BulkAttendanceItem,
    BulkAttendanceRequest,
    BulkAttendanceResponse,
)
from app.schemas.invoice import (
    InvoiceBase,
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    ShiftBillingBreakdown,
    GenerateInvoiceRequest,
    GenerateInvoiceResponse,
)

__all__ = [
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "Token",
    "TokenPayload",
    "LoginRequest",
    "ClientBase",
    "ClientCreate",
    "ClientUpdate",
    "ClientResponse",
    "SiteBase",
    "SiteCreate",
    "SiteUpdate",
    "SiteResponse",
    "ShiftRequirementsSchema",
    "GuardProfileBase",
    "GuardProfileCreate",
    "GuardProfileUpdate",
    "GuardProfileResponse",
    "ShiftRosterBase",
    "ShiftRosterCreate",
    "ShiftRosterUpdate",
    "ShiftRosterResponse",
    "WeeklyRosterAssignmentItem",
    "WeeklyRosterAssignRequest",
    "WeeklyRosterAssignResponse",
    "AttendanceBase",
    "AttendanceCreate",
    "AttendanceUpdate",
    "AttendanceResponse",
    "BulkAttendanceItem",
    "BulkAttendanceRequest",
    "BulkAttendanceResponse",
    "InvoiceBase",
    "InvoiceCreate",
    "InvoiceUpdate",
    "InvoiceResponse",
    "ShiftBillingBreakdown",
    "GenerateInvoiceRequest",
    "GenerateInvoiceResponse",
]
