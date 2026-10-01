"""
migrate_phase3.py
=================
Phase 3 schema migration — run once against Supabase (via pooler).

Adds to `clients` table:
  - pan_number          VARCHAR(10)
  - contract_start_date DATE
  - contract_end_date   DATE
  - contract_terms      TEXT
  - Tightens gst_number to VARCHAR(15) (safe no-op if already larger)

Adds to `sites` table:
  - required_security           INTEGER DEFAULT 0
  - required_housekeeping       INTEGER DEFAULT 0
  - required_nursing            INTEGER DEFAULT 0
  - contract_rate_security      NUMERIC(10,2)
  - contract_rate_housekeeping  NUMERIC(10,2)
  - contract_rate_nursing       NUMERIC(10,2)
  - latitude                    NUMERIC(9,6)
  - longitude                   NUMERIC(9,6)
  - geofence_radius_m           INTEGER DEFAULT 100

Usage:
    cd backend
    python migrate_phase3.py
"""

import sys
import os

# Make sure app package is importable from backend/
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine
from sqlalchemy import text

CLIENTS_COLUMNS = [
    "ALTER TABLE clients ALTER COLUMN gst_number TYPE VARCHAR(15);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_start_date DATE;",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_end_date DATE;",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_terms TEXT;",
]

SITES_COLUMNS = [
    "ALTER TABLE sites ADD COLUMN IF NOT EXISTS required_security INTEGER NOT NULL DEFAULT 0;",
    "ALTER TABLE sites ADD COLUMN IF NOT EXISTS required_housekeeping INTEGER NOT NULL DEFAULT 0;",
    "ALTER TABLE sites ADD COLUMN IF NOT EXISTS required_nursing INTEGER NOT NULL DEFAULT 0;",
    "ALTER TABLE sites ADD COLUMN IF NOT EXISTS contract_rate_security NUMERIC(10,2);",
    "ALTER TABLE sites ADD COLUMN IF NOT EXISTS contract_rate_housekeeping NUMERIC(10,2);",
    "ALTER TABLE sites ADD COLUMN IF NOT EXISTS contract_rate_nursing NUMERIC(10,2);",
    "ALTER TABLE sites ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);",
    "ALTER TABLE sites ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);",
    "ALTER TABLE sites ADD COLUMN IF NOT EXISTS geofence_radius_m INTEGER NOT NULL DEFAULT 100;",
]


def run_migration(statements: list[str], label: str) -> None:
    print(f"\n--- {label} ---")
    with engine.connect() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
                short = stmt[:70].replace("\n", " ")
                print(f"  [OK] {short}")
            except Exception as exc:
                short = stmt[:70].replace("\n", " ")
                # Ignore "already exists" / "type already is" errors
                err = str(exc).lower()
                if "already exists" in err or "already is" in err:
                    print(f"  [SKIP - already exists] {short}")
                    conn.rollback()
                else:
                    print(f"  [ERROR] {short}")
                    print(f"          {exc}")
                    conn.rollback()


if __name__ == "__main__":
    print("=== Phase 3 Migration: Client Contracts + Site Rates + GPS Stubs ===")
    run_migration(CLIENTS_COLUMNS, "clients table")
    run_migration(SITES_COLUMNS, "sites table")
    print("\n[DONE] Phase 3 migration complete.")
    print("Next: restart the backend and run a quick sanity check:")
    print("  GET /api/v1/sites/{id}/shortfall")
    print("  POST /api/v1/clients/ with gst_number to verify GSTIN validation")
