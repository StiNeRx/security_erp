#!/usr/bin/env python3
"""Quick script to create all Supabase tables and list them."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine
from app.models import User, Client, Site, GuardProfile, ShiftRoster, Attendance, Invoice  # noqa

print("Connecting to Supabase and creating all tables...")
Base.metadata.create_all(bind=engine)
print("ALL TABLES CREATED SUCCESSFULLY.")

from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"))
    tables = [row[0] for row in result]
print("Tables in Supabase public schema:", tables)
