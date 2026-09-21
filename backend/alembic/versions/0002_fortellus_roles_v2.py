"""Fortellus v2.0 - Expand user_role_enum and guard_status_enum

Revision ID: 0002_fortellus_roles_v2
Revises: 0001_initial_schema
Create Date: 2026-09-17 10:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0002_fortellus_roles_v2'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Expand user_role_enum with new Fortellus enterprise roles ──────────
    # PostgreSQL: to add values to an existing ENUM, use ALTER TYPE
    op.execute("ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'OWNER'")
    op.execute("ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'")
    op.execute("ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'HR'")
    op.execute("ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'OPERATIONS'")
    op.execute("ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'ACCOUNTS'")
    op.execute("ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'SUPERVISOR'")

    # ── 2. Expand guard_status_enum with BENCH and INACTIVE ──────────────────
    op.execute("ALTER TYPE guard_status_enum ADD VALUE IF NOT EXISTS 'BENCH'")
    op.execute("ALTER TYPE guard_status_enum ADD VALUE IF NOT EXISTS 'INACTIVE'")


def downgrade() -> None:
    # NOTE: PostgreSQL does not support removing enum values directly.
    # A full recreation of the type would be required on downgrade.
    # This is intentionally left as a no-op for safety.
    pass
