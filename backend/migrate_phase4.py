"""
migrate_phase4.py
=================
Phase 4 schema migration — executed against Supabase PostgreSQL.

Adds to `attendances` table:
  - check_in_lat                NUMERIC(9,6)
  - check_in_lng                NUMERIC(9,6)
  - check_out_lat               NUMERIC(9,6)
  - check_out_lng               NUMERIC(9,6)
  - distance_from_site_m        NUMERIC(8,2)
  - is_geofence_verified        BOOLEAN NOT NULL DEFAULT FALSE
  - geofence_status             VARCHAR(50) NOT NULL DEFAULT 'PENDING'
  - geofence_breach_reason      TEXT
  - device_id                   VARCHAR(100)
  - device_name                 VARCHAR(100)
  - verified_by_supervisor_id   INTEGER REFERENCES users(id) ON DELETE SET NULL
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine
from sqlalchemy import text

ATTENDANCE_COLUMNS = [
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS check_in_lat NUMERIC(9,6);",
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS check_in_lng NUMERIC(9,6);",
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS check_out_lat NUMERIC(9,6);",
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS check_out_lng NUMERIC(9,6);",
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS distance_from_site_m NUMERIC(8,2);",
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS is_geofence_verified BOOLEAN NOT NULL DEFAULT FALSE;",
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS geofence_status VARCHAR(50) NOT NULL DEFAULT 'PENDING';",
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS geofence_breach_reason TEXT;",
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS device_id VARCHAR(100);",
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS device_name VARCHAR(100);",
    "ALTER TABLE attendances ADD COLUMN IF NOT EXISTS verified_by_supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;",
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
                err = str(exc).lower()
                if "already exists" in err:
                    print(f"  [SKIP - already exists] {short}")
                    conn.rollback()
                else:
                    print(f"  [ERROR] {short}")
                    print(f"          {exc}")
                    conn.rollback()


if __name__ == "__main__":
    print("=== Phase 4 Migration: GPS Geofenced Attendance & Device Binding ===")
    run_migration(ATTENDANCE_COLUMNS, "attendances table")
    print("\n[DONE] Phase 4 migration complete.")
