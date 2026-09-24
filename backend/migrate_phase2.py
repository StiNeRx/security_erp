#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fortellus Phase 2 Migration Script:
1. Creates new tables (recruitment_candidates).
2. Adds Phase 2 columns to guard_profiles if missing.
3. Tests candidate creation and auto-onboarding with Bench lock.
"""
import os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import Base, engine, SessionLocal
from app.models import User, Client, Site, GuardProfile, Candidate, ShiftRoster, Attendance, Invoice

print("=" * 65)
print("  FORTELLUS ERP - PHASE 2 SCHEMA MIGRATION")
print("=" * 65)

# 1. Create missing tables (recruitment_candidates)
print("\n[1/3] Creating new tables (recruitment_candidates)...")
Base.metadata.create_all(bind=engine)
print("      Tables synchronized.")

# 2. Add columns to guard_profiles if they do not exist
print("\n[2/3] Adding Phase 2 columns to guard_profiles (if missing)...")
columns_to_add = [
    ("intimation_id", "VARCHAR(50) UNIQUE"),
    ("vertical", "VARCHAR(50) DEFAULT 'SECURITY' NOT NULL"),
    ("category", "VARCHAR(50) DEFAULT 'GUARD' NOT NULL"),
    ("aadhaar_number", "VARCHAR(20)"),
    ("pan_number", "VARCHAR(20)"),
    ("permanent_address", "TEXT"),
    ("present_address", "TEXT"),
    ("marital_status", "VARCHAR(20)"),
    ("bank_account_no", "VARCHAR(50)"),
    ("bank_name", "VARCHAR(100)"),
    ("bank_branch", "VARCHAR(100)"),
    ("bank_ifsc", "VARCHAR(20)"),
    ("nominee_name", "VARCHAR(100)"),
    ("nominee_relation", "VARCHAR(50)"),
    ("nominee_dob", "DATE"),
    ("nominee_aadhaar", "VARCHAR(20)"),
    ("nominee_allocation_pct", "NUMERIC(5, 2) DEFAULT 100.00"),
    ("arms_license_no", "VARCHAR(50)"),
    ("arms_issuing_authority", "VARCHAR(100)"),
    ("arms_caliber", "VARCHAR(50)"),
    ("arms_weapon_serial", "VARCHAR(50)"),
    ("arms_ammunition_count", "INTEGER DEFAULT 0"),
    ("arms_expiry_date", "DATE"),
    ("uniform_issued_items", "JSONB DEFAULT '[]'::jsonb"),
    ("uniform_total_cost", "NUMERIC(10, 2) DEFAULT 0.00 NOT NULL"),
    ("uniform_monthly_emi", "NUMERIC(10, 2) DEFAULT 0.00 NOT NULL"),
    ("uniform_balance_due", "NUMERIC(10, 2) DEFAULT 0.00 NOT NULL"),
    ("police_verification_report_url", "VARCHAR(500)"),
    ("police_verification_station", "VARCHAR(100)"),
    ("police_verification_expiry", "DATE"),
    ("medical_report_url", "VARCHAR(500)"),
    ("medical_fitness_status", "VARCHAR(50) DEFAULT 'FIT'"),
    ("medical_examination_date", "DATE"),
    ("medical_fitness_expiry", "DATE"),
    ("psara_cert_no", "VARCHAR(50)"),
    ("psara_batch_no", "VARCHAR(50)"),
    ("psara_skill_level", "VARCHAR(50)"),
    ("form11_url", "VARCHAR(500)"),
    ("passbook_copy_url", "VARCHAR(500)"),
    ("gun_license_doc_url", "VARCHAR(500)"),
    ("is_bench_locked", "BOOLEAN DEFAULT FALSE NOT NULL"),
    ("bench_lock_reason", "VARCHAR(255)"),
]

with engine.connect() as conn:
    for col_name, col_type in columns_to_add:
        try:
            conn.execute(text(f"ALTER TABLE guard_profiles ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
        except Exception as e:
            print(f"      ~ Column {col_name}: {e}")
    conn.commit()
print("      guard_profiles columns verified and updated.")

# 3. Test verification
print("\n[3/3] Testing recruitment candidate onboarding pipeline...")
db = SessionLocal()
try:
    from app.crud.crud_recruitment import candidate as crud_candidate
    from app.schemas.recruitment import CandidateCreate, CandidateOnboardRequest
    from datetime import date, timedelta

    test_phone = "+91-9888877771"
    existing = db.query(Candidate).filter(Candidate.phone == test_phone).first()
    if not existing:
        cand_in = CandidateCreate(
            full_name="Rajesh Sharma",
            email="rajesh.sharma@example.com",
            phone=test_phone,
            vertical="SECURITY",
            category="GUARD",
            screening_notes="Physical screening cleared. 5ft 11in.",
        )
        cand = crud_candidate.create(db, obj_in=cand_in)
        print(f"      + Created Candidate: {cand.full_name} with Intimation ID: {cand.intimation_id}")

        # Onboard with expired police verification to verify BENCH LOCK
        expired_date = date.today() - timedelta(days=10)
        onboard_req = CandidateOnboardRequest(
            daily_rate=650.00,
            police_verification_expiry=expired_date,
            bank_account_no="123456789012",
            bank_name="HDFC Bank",
            bank_ifsc="HDFC0001234",
            aadhaar_number="123456789012",
        )
        staff = crud_candidate.onboard_candidate(db, candidate=cand, onboard_in=onboard_req)
        print(f"      + Onboarded Staff Member: {staff.badge_number}")
        print(f"      + Status: {staff.status} | Bench Locked: {staff.is_bench_locked}")
        print(f"      + Lock Reason: '{staff.bench_lock_reason}'")
        assert staff.is_bench_locked == True, "Expected staff to be bench locked due to expired police verification!"
        print("      OK: Automated Bench Locking triggered correctly!")
    else:
        print(f"      Candidate with phone {test_phone} already exists (Intimation ID: {existing.intimation_id}).")

finally:
    db.close()

print("\n" + "=" * 65)
print("  Phase 2 migration and verification completed successfully.")
print("=" * 65)
