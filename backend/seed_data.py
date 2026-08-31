#!/usr/bin/env python3
"""Seed script to populate database with dummy data and test user 'stiner'."""

import os
import sys
from datetime import date
from decimal import Decimal

# Ensure backend root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.security import get_password_hash
from app.models import Base, User, UserRole, Client, GuardProfile, GuardStatus, ShiftRoster, ShiftType, RosterStatus, Attendance, AttendanceStatus, Invoice, InvoiceStatus, Site

# Use SQLite for seeding
SQLITE_URL = "sqlite:///./seed.db"
engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)


def get_db_session():
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed():
    print("=" * 60)
    print("SEEDING DATABASE")
    print("=" * 60)

    db = next(get_db_session())

    try:
        # 1. Create test user "stiner" with password "0000auth"
        print("\n1. Creating test user 'stiner'...")
        stiner_email = "stiner@example.com"
        existing_user = User.query.filter_by(email=stiner_email).first() if hasattr(User, 'query') else None
        
        # Use crud_user method
        from app.crud.crud_user import user as crud_user
        existing_user = crud_user.get_by_email(db, email=stiner_email)
        if existing_user:
            print(f"   + User {stiner_email} already exists, skipping...")
        else:
            from app.models.user import User as UserModel
            stiner = UserModel(
                email=stiner_email,
                hashed_password=get_password_hash("0000auth"),
                full_name="Stiner User",
                role=UserRole.ADMIN,
                is_active=True,
                is_superuser=True,
            )
            db.add(stiner)
            db.commit()
            db.refresh(stiner)
            print(f"   + Created user: {stiner_email} (role: ADMIN, superuser)")

        # 2. Create dummy clients directly as model instances
        print("\n2. Creating dummy clients...")
        clients = []
        client_data = [
            {"company_name": "Apex Security Services", "contact_person": "John Smith", "contact_email": "contact@apexsecurity.com", "contact_phone": "+91-9876543210", "billing_address": "123 Security Park, Bangalore", "gst_number": "29AAAAA0000A1Z5", "is_active": True},
            {"company_name": "Facility Management Associates", "contact_person": "Maria Johnson", "contact_email": "maria@fm associates.com", "contact_phone": "+91-9876543211", "billing_address": "456 Facility Ave, Mumbai", "gst_number": "29AAAAA0000A1Z6", "is_active": True},
            {"company_name": "Guardforce India", "contact_person": "Robert Brown", "contact_email": "admin@guardforce.in", "contact_phone": "+91-9876543212", "billing_address": "789 Guard Tower, Delhi", "gst_number": "29AAAAA0000A1Z7", "is_active": True},
        ]
        for cd in client_data:
            # Check if client already exists
            existing = db.query(Client).filter(Client.company_name == cd["company_name"]).first()
            if existing:
                print(f"   + Client '{cd['company_name']}' already exists, skipping...")
                clients.append(existing)
            else:
                client = Client(
                    user_id=None,
                    company_name=cd["company_name"],
                    contact_person=cd["contact_person"],
                    contact_email=cd["contact_email"],
                    contact_phone=cd["contact_phone"],
                    billing_address=cd["billing_address"],
                    gst_number=cd["gst_number"],
                    is_active=cd["is_active"],
                )
                db.add(client)
                db.commit()
                db.refresh(client)
                clients.append(client)
                print(f"   + Created client: {cd['company_name']}")

        # 3. Create guard profiles
        print("\n3. Creating guard profiles...")
        guards = []
        for i, client in enumerate(clients[:2], 1):
            guard_email = f"guard{i}@test.com"
            existing_guard_user = crud_user.get_by_email(db, email=guard_email)
            if not existing_guard_user:
                from app.models.user import User as UserModel2
                guard_user = UserModel2(
                    email=guard_email,
                    hashed_password=get_password_hash("GuardPass123!"),
                    full_name=f"Guard {i} Name",
                    role=UserRole.STAFF,
                    is_active=True,
                )
                db.add(guard_user)
                db.commit()
                db.refresh(guard_user)
            else:
                guard_user = existing_guard_user

            existing_guard = db.query(GuardProfile).filter(GuardProfile.user_id == guard_user.id).first()
            if existing_guard:
                print(f"   + Guard profile for {guard_email} already exists, skipping...")
                guards.append(existing_guard)
            else:
                guard_profile = GuardProfile(
                    user_id=guard_user.id,
                    badge_number=f"SG-{i:03d}",
                    daily_rate=Decimal("650.00" + str(i)),
                    status=GuardStatus.ACTIVE,
                )
                db.add(guard_profile)
                db.commit()
                db.refresh(guard_profile)
                guards.append(guard_profile)
                print(f"   + Created guard: SG-{guard_profile.badge_number} ({guard_user.full_name})")

        # 4. Create sites for clients
        print("\n4. Creating sites...")
        sites = []
        for i, client in enumerate(clients, 1):
            site_code = f"SITE-{i:03d}"
            existing_site = db.query(Site).filter(Site.site_code == site_code).first()
            if existing_site:
                print(f"   + Site '{site_code}' already exists, skipping...")
                sites.append(existing_site)
            else:
                site = Site(
                    client_id=client.id,
                    site_name=f"Site {i} - {client.company_name}",
                    site_code=site_code,
                    address=f"{i} Industrial Estate, City {i}",
                    city="Mumbai",
                    state="Maharashtra",
                    postal_code="400001",
                    shift_requirements={"day_shift_guards": 2, "night_shift_guards": 1},
                    is_active=True,
                )
                db.add(site)
                db.commit()
                db.refresh(site)
                sites.append(site)
                print(f"   + Created site: {site_code}")

        # 5. Create rosters
        print("\n5. Creating rosters...")
        target_date = date(2026, 8, 10)
        rosters = []
        for i, guard in enumerate(guards, 1):
            site_obj = sites[i % len(sites)] if sites else clients[0]
            roster = ShiftRoster(
                site_id=site_obj.id,
                guard_id=guard.id,
                date=target_date,
                shift_type=ShiftType.DAY if i % 2 == 1 else ShiftType.NIGHT,
                status=RosterStatus.SCHEDULED,
            )
            db.add(roster)
            db.commit()
            db.refresh(roster)
            rosters.append(roster)
            print(f"   + Created roster for guard {guard.badge_number}")

        # 6. Create attendance records
        print("\n6. Creating attendance records...")
        for i, roster in enumerate(rosters, 1):
            att_status = AttendanceStatus.PRESENT if i % 3 != 0 else AttendanceStatus.ABSENT
            attendance = Attendance(
                roster_id=roster.id,
                status=att_status,
                overtime_hours=Decimal("2.50" if i % 3 != 0 else "0.00"),
                remarks=f"Attendance record for roster {i}",
            )
            db.add(attendance)
            db.commit()
            print(f"   + Created attendance for roster {roster.id}")

        # 7. Create invoices
        print("\n7. Creating invoices...")
        for i, client in enumerate(clients, 1):
            inv_status = InvoiceStatus.DRAFT if i <= 2 else InvoiceStatus.PAID
            invoice = Invoice(
                client_id=client.id,
                invoice_number=f"INV-202608-{i:03d}",
                billing_month="2026-08",
                issue_date=date(2026, 8, 1),
                due_date=date(2026, 8, 16),
                subtotal=Decimal("25000.00" + str(i * 100)),
                tax_rate=Decimal("18.00"),
                tax_amount=Decimal("4500.00" + str(i * 50)),
                total_amount=Decimal("29500.00" + str(i * 150)),
                status=inv_status,
                notes=f"Monthly invoice for {client.company_name}",
            )
            db.add(invoice)
            db.commit()
            print(f"   + Created invoice: {invoice.invoice_number} ({invoice.status})")

        print("\n" + "=" * 60)
        print("SEEDING COMPLETE!")
        print("=" * 60)
        print("\nTest user credentials:")
        print(f"  Username: stiner")
        print(f"  Email:    stiner@example.com")
        print(f"  Password: 0000auth")
        print(f"  Role:     ADMIN (superuser)")
        print("\nDatabase seeded successfully!")
        print("You can now start the backend and frontend to test all views!")

    except Exception as e:
        print(f"\n✗ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()