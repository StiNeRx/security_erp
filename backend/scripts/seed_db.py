"""Database seeder script for Security & Facility Management ERP."""
import sys
import os
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

# Ensure backend root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.database import SessionLocal, engine, Base
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
from app.core.security import get_password_hash


def seed():
    print("🌱 Starting database seeding...")
    # Optionally create all tables if not created via migrations
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Users
        admin_user = db.query(User).filter(User.email == "admin@securityerp.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@securityerp.com",
                hashed_password=get_password_hash("Admin@12345"),
                full_name="System Administrator",
                phone_number="+91-9876543210",
                role=UserRole.ADMIN,
                is_active=True,
                is_superuser=True,
            )
            db.add(admin_user)

        client_user = db.query(User).filter(User.email == "client.manager@acmecorp.com").first()
        if not client_user:
            client_user = User(
                email="client.manager@acmecorp.com",
                hashed_password=get_password_hash("Client@12345"),
                full_name="John Doe",
                phone_number="+91-9876543211",
                role=UserRole.CLIENT,
                is_active=True,
            )
            db.add(client_user)

        guard_user1 = db.query(User).filter(User.email == "guard.ramesh@securityerp.com").first()
        if not guard_user1:
            guard_user1 = User(
                email="guard.ramesh@securityerp.com",
                hashed_password=get_password_hash("Guard@12345"),
                full_name="Ramesh Kumar",
                phone_number="+91-9876543212",
                role=UserRole.STAFF,
                is_active=True,
            )
            db.add(guard_user1)

        guard_user2 = db.query(User).filter(User.email == "guard.suresh@securityerp.com").first()
        if not guard_user2:
            guard_user2 = User(
                email="guard.suresh@securityerp.com",
                hashed_password=get_password_hash("Guard@12345"),
                full_name="Suresh Singh",
                phone_number="+91-9876543213",
                role=UserRole.STAFF,
                is_active=True,
            )
            db.add(guard_user2)

        db.commit()
        db.refresh(admin_user)
        db.refresh(client_user)
        db.refresh(guard_user1)
        db.refresh(guard_user2)

        # 2. Seed Client
        acme_client = db.query(Client).filter(Client.company_name == "Acme Corporation").first()
        if not acme_client:
            acme_client = Client(
                user_id=client_user.id,
                company_name="Acme Corporation",
                contact_person="John Doe",
                contact_email="client.manager@acmecorp.com",
                contact_phone="+91-9876543211",
                billing_address="Tower A, 5th Floor, Cyber City, Gurugram, Haryana, 122002",
                gst_number="06AAAAA0000A1Z5",
                is_active=True,
            )
            db.add(acme_client)
            db.commit()
            db.refresh(acme_client)

        # 3. Seed Site
        hq_site = db.query(Site).filter(Site.site_code == "ACME-HQ-01").first()
        if not hq_site:
            hq_site = Site(
                client_id=acme_client.id,
                site_name="Acme Corporate HQ",
                site_code="ACME-HQ-01",
                address="Plot 101, Phase 2, Udyog Vihar",
                city="Gurugram",
                state="Haryana",
                postal_code="122016",
                shift_requirements={
                    "day_shift_guards": 2,
                    "night_shift_guards": 2,
                    "supervisor_required": True,
                },
                contact_phone="+91-124-4567890",
                is_active=True,
            )
            db.add(hq_site)
            db.commit()
            db.refresh(hq_site)

        # 4. Seed Guard Profiles
        guard1 = db.query(GuardProfile).filter(GuardProfile.user_id == guard_user1.id).first()
        if not guard1:
            guard1 = GuardProfile(
                user_id=guard_user1.id,
                badge_number="SEC-G-001",
                daily_rate=Decimal("650.00"),
                status=GuardStatus.ACTIVE,
                emergency_contact="+91-9123456780",
                joining_date=date(2025, 1, 15),
                notes="Experienced in fire safety and visitor management.",
            )
            db.add(guard1)

        guard2 = db.query(GuardProfile).filter(GuardProfile.user_id == guard_user2.id).first()
        if not guard2:
            guard2 = GuardProfile(
                user_id=guard_user2.id,
                badge_number="SEC-G-002",
                daily_rate=Decimal("600.00"),
                status=GuardStatus.ACTIVE,
                emergency_contact="+91-9123456781",
                joining_date=date(2025, 3, 1),
                notes="Certified for CCTV monitoring and night patrolling.",
            )
            db.add(guard2)

        db.commit()
        db.refresh(guard1)
        db.refresh(guard2)

        # 5. Seed Shift Rosters
        today = date.today()
        roster1 = (
            db.query(ShiftRoster)
            .filter(
                ShiftRoster.site_id == hq_site.id,
                ShiftRoster.guard_id == guard1.id,
                ShiftRoster.date == today,
                ShiftRoster.shift_type == ShiftType.DAY,
            )
            .first()
        )
        if not roster1:
            roster1 = ShiftRoster(
                site_id=hq_site.id,
                guard_id=guard1.id,
                date=today,
                shift_type=ShiftType.DAY,
                status=RosterStatus.COMPLETED,
                notes="Gate 1 Main Entry",
            )
            db.add(roster1)

        roster2 = (
            db.query(ShiftRoster)
            .filter(
                ShiftRoster.site_id == hq_site.id,
                ShiftRoster.guard_id == guard2.id,
                ShiftRoster.date == today,
                ShiftRoster.shift_type == ShiftType.NIGHT,
            )
            .first()
        )
        if not roster2:
            roster2 = ShiftRoster(
                site_id=hq_site.id,
                guard_id=guard2.id,
                date=today,
                shift_type=ShiftType.NIGHT,
                status=RosterStatus.SCHEDULED,
                notes="Perimeter Patrol",
            )
            db.add(roster2)

        db.commit()
        db.refresh(roster1)
        db.refresh(roster2)

        # 6. Seed Attendance
        att1 = db.query(Attendance).filter(Attendance.roster_id == roster1.id).first()
        if not att1:
            check_in = datetime.now(timezone.utc).replace(hour=8, minute=0, second=0)
            check_out = datetime.now(timezone.utc).replace(hour=18, minute=0, second=0)
            att1 = Attendance(
                roster_id=roster1.id,
                status=AttendanceStatus.PRESENT,
                check_in_time=check_in,
                check_out_time=check_out,
                overtime_hours=Decimal("2.00"),
                remarks="Extra 2 hours for evening VIP escort.",
            )
            db.add(att1)
            db.commit()

        # 7. Seed Invoice
        inv = db.query(Invoice).filter(Invoice.invoice_number == "INV-202608-001").first()
        if not inv:
            subtotal = Decimal("45000.00")
            tax_rate = Decimal("18.00")
            tax_amount = Decimal("8100.00")
            total_amount = Decimal("53100.00")
            inv = Invoice(
                client_id=acme_client.id,
                invoice_number="INV-202608-001",
                billing_month="2026-08",
                issue_date=today,
                due_date=today + timedelta(days=15),
                subtotal=subtotal,
                tax_rate=tax_rate,
                tax_amount=tax_amount,
                total_amount=total_amount,
                status=InvoiceStatus.SENT,
                notes="Security services for August 2026 at Acme Corporate HQ.",
            )
            db.add(inv)
            db.commit()

        print(" Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed()
