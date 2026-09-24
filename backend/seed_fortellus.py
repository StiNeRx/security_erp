#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fortellus Enterprise ERP - Production Seed Script (Phase 1)
-----------------------------------------------------------
Creates all enterprise-role user accounts in Supabase PostgreSQL.
The Owner account is created first so the client can log in immediately.

Usage:
    cd backend
    .\\venv\\Scripts\\python.exe seed_fortellus.py
"""

import os
import sys
import io

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Ensure the backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.security import get_password_hash
from app.models.enums import UserRole
from app.models.user import User
from app.core.database import Base, engine, SessionLocal


print("=" * 65)
print("  FORTELLUS ENTERPRISE ERP - SUPABASE SEED (Phase 1)")
print("=" * 65)

# -- 1. Create all schema tables if they don't exist -------------------------
print("\n[1/3] Creating schema tables in Supabase (if missing)...")
# Import all models so Base.metadata is fully populated
from app.models import (  # noqa: F401
    User, Client, Site, GuardProfile, ShiftRoster, Attendance, Invoice
)
Base.metadata.create_all(bind=engine)
print("      OK - Schema ready.")

# -- 2. Seed enterprise user accounts ----------------------------------------
print("\n[2/3] Seeding Fortellus enterprise accounts...")

USERS_TO_CREATE = [
    {
        "email": "owner@fortellus.com",
        "full_name": "Fortellus Owner",
        "password": "auth0000",
        "role": UserRole.OWNER,
        "is_superuser": True,
        "phone_number": "+91-9000000001",
    },
    {
        "email": "superadmin@fortellus.com",
        "full_name": "Super Administrator",
        "password": "auth0000",
        "role": UserRole.SUPER_ADMIN,
        "is_superuser": True,
        "phone_number": "+91-9000000002",
    },
    {
        "email": "hr@fortellus.com",
        "full_name": "HR Manager",
        "password": "auth0000",
        "role": UserRole.HR,
        "is_superuser": False,
        "phone_number": "+91-9000000003",
    },
    {
        "email": "operations@fortellus.com",
        "full_name": "Operations Manager",
        "password": "auth0000",
        "role": UserRole.OPERATIONS,
        "is_superuser": False,
        "phone_number": "+91-9000000004",
    },
    {
        "email": "accounts@fortellus.com",
        "full_name": "Accounts Manager",
        "password": "auth0000",
        "role": UserRole.ACCOUNTS,
        "is_superuser": False,
        "phone_number": "+91-9000000005",
    },
    {
        "email": "supervisor@fortellus.com",
        "full_name": "Field Supervisor",
        "password": "auth0000",
        "role": UserRole.SUPERVISOR,
        "is_superuser": False,
        "phone_number": "+91-9000000006",
    },
    {
        "email": "client@techpark.com",
        "full_name": "TechPark Client POC",
        "password": "auth0000",
        "role": UserRole.CLIENT,
        "is_superuser": False,
        "phone_number": "+91-9000000007",
    },
    {
        "email": "guard@fortellus.com",
        "full_name": "Field Guard",
        "password": "auth0000",
        "role": UserRole.STAFF,
        "is_superuser": False,
        "phone_number": "+91-9000000008",
    },
]

db = SessionLocal()
try:
    created = 0
    skipped = 0
    for u in USERS_TO_CREATE:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            print(f"      ~ Skipped (exists): {u['email']} [{u['role'].value}]")
            skipped += 1
            continue

        new_user = User(
            email=u["email"],
            hashed_password=get_password_hash(u["password"]),
            full_name=u["full_name"],
            phone_number=u["phone_number"],
            role=u["role"],
            is_active=True,
            is_superuser=u["is_superuser"],
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"      + Created [{u['role'].value:12s}]: {u['email']}  (id={new_user.id})")
        created += 1

    print(f"\n      Summary: {created} created, {skipped} already existed.")

except Exception as e:
    db.rollback()
    print(f"\n  ERROR during seeding: {e}")
    raise
finally:
    db.close()

# -- 3. Final verification ---------------------------------------------------
print("\n[3/3] Verifying Owner account...")
db = SessionLocal()
try:
    owner = db.query(User).filter(User.email == "owner@fortellus.com").first()
    if owner:
        print(f"      OWNER OK -> id={owner.id}, role={owner.role.value}, superuser={owner.is_superuser}")
        print()
        print("  +--------------------------------------------------+")
        print("  |  FIRST LOGIN CREDENTIALS                         |")
        print("  |  Email    : owner@fortellus.com                  |")
        print("  |  Password : auth0000                             |")
        print("  |  Role     : OWNER (Executive Dashboard Access)   |")
        print("  +--------------------------------------------------+")
    else:
        print("  OWNER account not found - check for errors above.")
finally:
    db.close()

print("\n" + "=" * 65)
print("  Seed complete. Supabase is live for Phase 1.")
print("=" * 65)
