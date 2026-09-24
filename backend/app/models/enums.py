import enum


class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    HR = "HR"
    OPERATIONS = "OPERATIONS"
    ACCOUNTS = "ACCOUNTS"
    SUPERVISOR = "SUPERVISOR"
    CLIENT = "CLIENT"
    STAFF = "STAFF"


class GuardStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    BENCH = "BENCH"
    ON_LEAVE = "ON_LEAVE"
    INACTIVE = "INACTIVE"
    TERMINATED = "TERMINATED"


class StaffVertical(str, enum.Enum):
    SECURITY = "SECURITY"
    HOUSEKEEPING = "HOUSEKEEPING"
    NURSING = "NURSING"


class StaffCategory(str, enum.Enum):
    GUARD = "GUARD"
    GUNMAN = "GUNMAN"
    HEAD_GUARD = "HEAD_GUARD"
    SUPERVISOR = "SUPERVISOR"
    FIELD_OFFICER = "FIELD_OFFICER"
    JANITOR = "JANITOR"
    HOUSEKEEPER = "HOUSEKEEPER"
    NURSE_ASSISTANT = "NURSE_ASSISTANT"
    GDA = "GDA"


class CandidateStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    VERIFIED = "VERIFIED"
    ONBOARDED = "ONBOARDED"
    REJECTED = "REJECTED"



class ShiftType(str, enum.Enum):
    DAY = "DAY"
    NIGHT = "NIGHT"


class RosterStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    LATE = "LATE"


class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"
