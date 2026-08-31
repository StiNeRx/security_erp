"""Initial schema for Security & Facility Management ERP

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-21 04:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Users Table
    user_role_enum = sa.Enum('ADMIN', 'CLIENT', 'STAFF', name='user_role_enum')
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('phone_number', sa.String(length=50), nullable=True),
        sa.Column('role', user_role_enum, nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)

    # 2. Create Clients Table
    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('company_name', sa.String(length=255), nullable=False),
        sa.Column('contact_person', sa.String(length=255), nullable=False),
        sa.Column('contact_email', sa.String(length=255), nullable=False),
        sa.Column('contact_phone', sa.String(length=50), nullable=False),
        sa.Column('billing_address', sa.Text(), nullable=False),
        sa.Column('gst_number', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_clients_id'), 'clients', ['id'], unique=False)
    op.create_index(op.f('ix_clients_company_name'), 'clients', ['company_name'], unique=True)
    op.create_index(op.f('ix_clients_user_id'), 'clients', ['user_id'], unique=False)
    op.create_index(op.f('ix_clients_gst_number'), 'clients', ['gst_number'], unique=False)

    # 3. Create Sites Table
    op.create_table(
        'sites',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('site_name', sa.String(length=255), nullable=False),
        sa.Column('site_code', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('postal_code', sa.String(length=20), nullable=False),
        sa.Column('shift_requirements', sa.JSON(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('contact_phone', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_sites_id'), 'sites', ['id'], unique=False)
    op.create_index(op.f('ix_sites_client_id'), 'sites', ['client_id'], unique=False)
    op.create_index(op.f('ix_sites_site_name'), 'sites', ['site_name'], unique=False)
    op.create_index(op.f('ix_sites_site_code'), 'sites', ['site_code'], unique=True)

    # 4. Create Guard Profiles Table
    guard_status_enum = sa.Enum('ACTIVE', 'ON_LEAVE', 'TERMINATED', name='guard_status_enum')
    op.create_table(
        'guard_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('badge_number', sa.String(length=50), nullable=False),
        sa.Column('daily_rate', sa.Numeric(precision=10, scale=2), nullable=False, server_default=sa.text('0.00')),
        sa.Column('status', guard_status_enum, nullable=False),
        sa.Column('emergency_contact', sa.String(length=100), nullable=True),
        sa.Column('joining_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index(op.f('ix_guard_profiles_id'), 'guard_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_guard_profiles_user_id'), 'guard_profiles', ['user_id'], unique=True)
    op.create_index(op.f('ix_guard_profiles_badge_number'), 'guard_profiles', ['badge_number'], unique=True)
    op.create_index(op.f('ix_guard_profiles_status'), 'guard_profiles', ['status'], unique=False)

    # 5. Create Shift Rosters Table
    shift_type_enum = sa.Enum('DAY', 'NIGHT', name='shift_type_enum')
    roster_status_enum = sa.Enum('SCHEDULED', 'COMPLETED', 'CANCELLED', name='roster_status_enum')
    op.create_table(
        'shift_rosters',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('guard_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('shift_type', shift_type_enum, nullable=False),
        sa.Column('status', roster_status_enum, nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['guard_id'], ['guard_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('site_id', 'guard_id', 'date', 'shift_type', name='uq_site_guard_date_shift'),
    )
    op.create_index(op.f('ix_shift_rosters_id'), 'shift_rosters', ['id'], unique=False)
    op.create_index(op.f('ix_shift_rosters_site_id'), 'shift_rosters', ['site_id'], unique=False)
    op.create_index(op.f('ix_shift_rosters_guard_id'), 'shift_rosters', ['guard_id'], unique=False)
    op.create_index(op.f('ix_shift_rosters_date'), 'shift_rosters', ['date'], unique=False)
    op.create_index(op.f('ix_shift_rosters_shift_type'), 'shift_rosters', ['shift_type'], unique=False)
    op.create_index(op.f('ix_shift_rosters_status'), 'shift_rosters', ['status'], unique=False)

    # 6. Create Attendances Table
    attendance_status_enum = sa.Enum('PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', name='attendance_status_enum')
    op.create_table(
        'attendances',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('roster_id', sa.Integer(), nullable=False),
        sa.Column('status', attendance_status_enum, nullable=False),
        sa.Column('check_in_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('check_out_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('overtime_hours', sa.Numeric(precision=4, scale=2), nullable=False, server_default=sa.text('0.00')),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['roster_id'], ['shift_rosters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('roster_id'),
    )
    op.create_index(op.f('ix_attendances_id'), 'attendances', ['id'], unique=False)
    op.create_index(op.f('ix_attendances_roster_id'), 'attendances', ['roster_id'], unique=True)
    op.create_index(op.f('ix_attendances_status'), 'attendances', ['status'], unique=False)

    # 7. Create Invoices Table
    invoice_status_enum = sa.Enum('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', name='invoice_status_enum')
    op.create_table(
        'invoices',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('invoice_number', sa.String(length=100), nullable=False),
        sa.Column('billing_month', sa.String(length=20), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False, server_default=sa.text('0.00')),
        sa.Column('tax_rate', sa.Numeric(precision=4, scale=2), nullable=False, server_default=sa.text('18.00')),
        sa.Column('tax_amount', sa.Numeric(precision=12, scale=2), nullable=False, server_default=sa.text('0.00')),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=False, server_default=sa.text('0.00')),
        sa.Column('status', invoice_status_enum, nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_invoices_id'), 'invoices', ['id'], unique=False)
    op.create_index(op.f('ix_invoices_client_id'), 'invoices', ['client_id'], unique=False)
    op.create_index(op.f('ix_invoices_invoice_number'), 'invoices', ['invoice_number'], unique=True)
    op.create_index(op.f('ix_invoices_billing_month'), 'invoices', ['billing_month'], unique=False)
    op.create_index(op.f('ix_invoices_status'), 'invoices', ['status'], unique=False)


def downgrade() -> None:
    op.drop_table('invoices')
    op.drop_table('attendances')
    op.drop_table('shift_rosters')
    op.drop_table('guard_profiles')
    op.drop_table('sites')
    op.drop_table('clients')
    op.drop_table('users')

    # Drop Postgres ENUM types
    op.execute("DROP TYPE IF EXISTS invoice_status_enum CASCADE;")
    op.execute("DROP TYPE IF EXISTS attendance_status_enum CASCADE;")
    op.execute("DROP TYPE IF EXISTS roster_status_enum CASCADE;")
    op.execute("DROP TYPE IF EXISTS shift_type_enum CASCADE;")
    op.execute("DROP TYPE IF EXISTS guard_status_enum CASCADE;")
    op.execute("DROP TYPE IF EXISTS user_role_enum CASCADE;")
