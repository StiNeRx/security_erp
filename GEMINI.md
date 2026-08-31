# Security & Facility Management ERP
Path: D:\Clients_works\security_erp

## Stack Specifications
- Backend: Python FastAPI in `/backend`, PostgreSQL database, SQLAlchemy ORM, JWT Auth.
- Frontend: React (Vite) in `/frontend`, Tailwind CSS, Axios.

## Core Database Schema
1. User: id, username, email, password_hash, role (ADMIN, CLIENT, STAFF)
2. Client: id, company_name, contact_person, email, phone
3. Site: id, client_id, site_name, address, shift_requirements
4. GuardProfile: id, user_id, full_name, phone, daily_rate, status
5. ShiftRoster: id, site_id, guard_id, date, shift_type (DAY/NIGHT)
6. Attendance: id, roster_id, status (PRESENT, ABSENT, OVERTIME), overtime_hours
7. Invoice: id, client_id, month, total_amount, status (DRAFT, PAID)