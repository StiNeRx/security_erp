import os
import sys
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.main import app
from app.models import (
    User,
    UserRole,
    Client,
    Site,
    GuardProfile,
    GuardStatus,
    ShiftRoster,
    ShiftType,
    RosterStatus,
    Attendance,
    AttendanceStatus,
    Invoice,
    InvoiceStatus,
)

# Test Database Engine (SQLite in-memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh database tables for each test and provide a session."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def seeded_data(db_session):
    """Seed sample Admin, Client, and Staff users with related entities."""
    # 1. Admin User
    admin = User(
        email="admin@test.com",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True,
        is_superuser=True,
    )
    db_session.add(admin)

    # 2. Client 1 User & Client 2 User
    client_user1 = User(
        email="client1@test.com",
        hashed_password=get_password_hash("ClientPass123!"),
        full_name="Client One Corp Rep",
        role=UserRole.CLIENT,
        is_active=True,
    )
    client_user2 = User(
        email="client2@test.com",
        hashed_password=get_password_hash("ClientPass123!"),
        full_name="Client Two Corp Rep",
        role=UserRole.CLIENT,
        is_active=True,
    )
    db_session.add(client_user1)
    db_session.add(client_user2)

    # 3. Staff Guard Users (Guard 1 & Guard 2)
    guard_user1 = User(
        email="guard1@test.com",
        hashed_password=get_password_hash("GuardPass123!"),
        full_name="John Security Guard",
        role=UserRole.STAFF,
        is_active=True,
    )
    guard_user2 = User(
        email="guard2@test.com",
        hashed_password=get_password_hash("GuardPass123!"),
        full_name="Dave Patrol Guard",
        role=UserRole.STAFF,
        is_active=True,
    )
    db_session.add(guard_user1)
    db_session.add(guard_user2)
    db_session.commit()

    # 4. Client Companies
    company1 = Client(
        user_id=client_user1.id,
        company_name="Apex Logistics Ltd",
        contact_person="Client One Corp Rep",
        contact_email="client1@test.com",
        contact_phone="+91-9000000001",
        billing_address="Apex Tower, Sector 18",
        gst_number="07AAAAA0000A1Z1",
        is_active=True,
    )
    company2 = Client(
        user_id=client_user2.id,
        company_name="Beacon Retailers Ltd",
        contact_person="Client Two Corp Rep",
        contact_email="client2@test.com",
        contact_phone="+91-9000000002",
        billing_address="Beacon Mall, MG Road",
        gst_number="07AAAAA0000A1Z2",
        is_active=True,
    )
    db_session.add(company1)
    db_session.add(company2)
    db_session.commit()

    # 5. Sites for Company 1 & Company 2
    site1 = Site(
        client_id=company1.id,
        site_name="Apex Warehouse Hub",
        site_code="APEX-WH-01",
        address="Plot 45, Udyog Vihar",
        city="Gurugram",
        state="Haryana",
        postal_code="122016",
        shift_requirements={"day_shift_guards": 2, "night_shift_guards": 2},
        is_active=True,
    )
    site2 = Site(
        client_id=company2.id,
        site_name="Beacon Shopping Mall",
        site_code="BEAC-MALL-01",
        address="102 MG Road",
        city="Gurugram",
        state="Haryana",
        postal_code="122002",
        shift_requirements={"day_shift_guards": 4, "night_shift_guards": 3},
        is_active=True,
    )
    db_session.add(site1)
    db_session.add(site2)
    db_session.commit()

    # 6. Guard Profiles
    guard_profile1 = GuardProfile(
        user_id=guard_user1.id,
        badge_number="SEC-001",
        daily_rate=Decimal("700.00"),
        status=GuardStatus.ACTIVE,
    )
    guard_profile2 = GuardProfile(
        user_id=guard_user2.id,
        badge_number="SEC-002",
        daily_rate=Decimal("650.00"),
        status=GuardStatus.ACTIVE,
    )
    db_session.add(guard_profile1)
    db_session.add(guard_profile2)
    db_session.commit()

    # 7. Pre-scheduled Rosters for August 2026
    target_date = date(2026, 8, 10)
    roster1 = ShiftRoster(
        site_id=site1.id,
        guard_id=guard_profile1.id,
        date=target_date,
        shift_type=ShiftType.DAY,
        status=RosterStatus.COMPLETED,
    )
    roster2 = ShiftRoster(
        site_id=site2.id,
        guard_id=guard_profile2.id,
        date=target_date,
        shift_type=ShiftType.NIGHT,
        status=RosterStatus.SCHEDULED,
    )
    db_session.add(roster1)
    db_session.add(roster2)
    db_session.commit()

    # 8. Pre-recorded Attendance for Roster 1
    att1 = Attendance(
        roster_id=roster1.id,
        status=AttendanceStatus.PRESENT,
        overtime_hours=Decimal("2.00"),
        remarks="Completed regular day shift + 2h overtime",
    )
    db_session.add(att1)

    # 9. Existing Invoice for Company 1
    inv1 = Invoice(
        client_id=company1.id,
        invoice_number="INV-202607-001",
        billing_month="2026-07",
        issue_date=date(2026, 8, 1),
        due_date=date(2026, 8, 16),
        subtotal=Decimal("21000.00"),
        tax_rate=Decimal("18.00"),
        tax_amount=Decimal("3780.00"),
        total_amount=Decimal("24780.00"),
        status=InvoiceStatus.SENT,
    )
    db_session.add(inv1)
    db_session.commit()

    return {
        "admin": admin,
        "client_user1": client_user1,
        "client_user2": client_user2,
        "guard_user1": guard_user1,
        "guard_user2": guard_user2,
        "company1": company1,
        "company2": company2,
        "site1": site1,
        "site2": site2,
        "guard_profile1": guard_profile1,
        "guard_profile2": guard_profile2,
        "roster1": roster1,
        "roster2": roster2,
        "att1": att1,
        "inv1": inv1,
    }


def get_token_headers(user_id: int) -> dict:
    """Generate authorization bearer headers for a user ID."""
    token = create_access_token(subject=user_id)
    return {"Authorization": f"Bearer {token}"}
