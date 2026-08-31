# Security & Facility Management ERP - Backend API

A modular, production-ready REST API built with **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.0**, and **Alembic** designed for Security and Facility Management operations.

---

## 🏗️ Architecture Overview

The system models end-to-end security operations including User Management (RBAC), Client CRM, Site Shift Requirements, Guard Rostering, Attendance / Overtime Tracking, and Client Invoicing.

```
backend/
├── app/
│   ├── main.py                  # FastAPI application entrypoint & middleware
│   ├── core/                    # Core configuration, database engine, security
│   │   ├── config.py            # Pydantic Settings & environment variables
│   │   ├── database.py          # SQLAlchemy 2.0 engine, SessionLocal, get_db
│   │   └── security.py          # Password hashing (bcrypt) & JWT helpers
│   ├── models/                  # SQLAlchemy 2.0 ORM Models
│   │   ├── base.py              # Base model & timestamp mixins
│   │   ├── enums.py             # UserRole, GuardStatus, ShiftType, AttendanceStatus, InvoiceStatus
│   │   ├── user.py              # User entity (ADMIN, CLIENT, STAFF)
│   │   ├── client.py            # Client business details & GST
│   │   ├── site.py              # Client sites & shift requirements (JSON)
│   │   ├── guard.py             # GuardProfile (daily rate, badge number, status)
│   │   ├── roster.py            # ShiftRoster (Site, Guard, date, shift type)
│   │   ├── attendance.py        # Attendance (Check-in/out, status, overtime hours)
│   │   └── invoice.py           # Invoices (billing month, tax rate, total amount, status)
│   ├── schemas/                 # Pydantic v2 validation & response schemas
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── site.py
│   │   ├── guard.py
│   │   ├── roster.py
│   │   ├── attendance.py
│   │   └── invoice.py
│   ├── crud/                    # Reusable CRUD & database operations
│   │   ├── base.py              # Generic CRUDBase class
│   │   ├── crud_user.py
│   │   ├── crud_client.py
│   │   ├── crud_site.py
│   │   ├── crud_guard.py
│   │   ├── crud_roster.py
│   │   ├── crud_attendance.py
│   │   └── crud_invoice.py
│   └── api/                     # API Routers
│       └── v1/
│           ├── api.py           # Aggregated v1 router
│           └── endpoints/       # Entity endpoints (CRUD & queries)
├── alembic/                     # Alembic migration environment
│   ├── env.py                   # Dynamic config & target metadata
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial_schema.py # Initial database migration
├── scripts/
│   └── seed_db.py               # Database seeder script
├── alembic.ini                  # Alembic CLI configuration
├── .env.example                 # Example environment variables
├── .env                         # Local environment settings
└── requirements.txt             # Python project dependencies
```

---

## 📋 Entity Specifications

| Entity | Description | Key Relationships |
| :--- | :--- | :--- |
| **User** | Authentication & roles (`ADMIN`, `CLIENT`, `STAFF`) | 1-to-1 with `GuardProfile`, 1-to-1 with `Client` |
| **Client** | Client enterprise profiles, contacts, billing & GST info | Has many `Site`, has many `Invoice` |
| **Site** | Guard deployment locations & shift requirements | Belongs to `Client`, has many `ShiftRoster` |
| **GuardProfile**| Security guard details, daily rate, badge number, status | Belongs to `User`, has many `ShiftRoster` |
| **ShiftRoster** | Scheduled guard shifts (`DAY` / `NIGHT`) by date & site | Belongs to `Site` & `GuardProfile`, 1-to-1 `Attendance` |
| **Attendance** | Check-in/out timestamps, status, overtime tracking | Belongs to `ShiftRoster` |
| **Invoice** | Monthly client billing, tax calculation, payment status | Belongs to `Client` |

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+ (Python 3.13 supported)
- PostgreSQL database instance running locally or in Docker

### 2. Environment Setup

Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### 3. Configure Database

Copy `.env.example` to `.env` (if not already done) and configure your PostgreSQL connection:
```ini
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=security_erp
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/security_erp
```

### 4. Run Alembic Database Migrations

Apply the initial schema migration:
```bash
alembic upgrade head
```

To create new migrations in the future after modifying SQLAlchemy models:
```bash
alembic revision --autogenerate -m "description_of_change"
alembic upgrade head
```

### 5. Seed Mock Data (Optional)

Populate sample users (Admin, Client, Guards), a client company, deployment site, shift rosters, attendance records, and an invoice:
```bash
python scripts/seed_db.py
```

### 6. Run the FastAPI Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📖 API Documentation & Endpoints

Once the server is running, explore interactive Swagger docs at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### Master Endpoint Routes

| Resource | Methods | Base URL | Description |
| :--- | :--- | :--- | :--- |
| **Users** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/users/` | Manage user credentials & roles |
| **Clients** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/clients/` | Client corporate accounts |
| **Sites** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/sites/` | Sites & guard deployment configs |
| **Guards** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/guards/` | Guard profiles, badge numbers & rates |
| **Shift Rosters**| `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/rosters/` | Shift assignments & schedules |
| **Attendance** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/attendances/` | Check-in/out & overtime records |
| **Invoices** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/invoices/` | Client billing & monthly invoices |
