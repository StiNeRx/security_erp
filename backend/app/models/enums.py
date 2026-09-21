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
