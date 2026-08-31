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

## Frontend Pages
| Page | Status | API Integration |
|------|--------|----------------|
| Dashboard | ✅ Complete | - |
| Personnel | ✅ Complete | `GET /api/v1/guards/` |
| ClientsView | ✅ Complete | `GET /api/v1/clients/` |
| RosterView | ✅ Complete | `GET /api/v1/guards/` (with rosters) |
| AttendanceView | ✅ Complete | `GET /api/v1/attendance/` |
| InvoicesView | ✅ Complete | `GET /api/v1/invoices/` |
| Login | ✅ Complete | - |

## Routing
- `/dashboard` - Dashboard view
- `/personnel` - Guard Personnel view
- `/clients` - ClientsView (manage client companies)
- `/rosters` - RosterView (shift assignments)
- `/attendance` - AttendanceView (attendance records)
- `/billing` - InvoicesView (billing/invoices)
- `/login` - Login page

## Backend API Endpoints (all operational)
### Authentication
- `POST /api/v1/auth/login` - JSON login
- `POST /api/v1/auth/login/access-token` - OAuth2 form login
- `GET /api/v1/auth/me` - Current user profile

### Clients
- `GET /api/v1/clients/` - List clients
- `POST /api/v1/clients/` - Create client (Admin only)
- `GET /api/v1/clients/{client_id}` - Get client by ID
- `PUT /api/v1/clients/{client_id}` - Update client (Admin only)
- `DELETE /api/v1/clients/{client_id}` - Delete client (Admin only)
- `GET /api/v1/clients/{client_id}/sites` - Get client's sites
- `GET /api/v1/clients/{client_id}/invoices` - Get client's invoices

### Guards
- `GET /api/v1/guards/` - List guard profiles
- `POST /api/v1/guards/` - Create guard profile (Admin only)
- `GET /api/v1/guards/{guard_id}` - Get guard by ID
- `PUT /api/v1/guards/{guard_id}` - Update guard (Admin only)
- `DELETE /api/v1/guards/{guard_id}` - Delete guard (Admin only)
- `GET /api/v1/guards/{guard_id}/rosters` - Get guard's rosters

### Rosters
- `GET /api/v1/rosters/` - List rosters (scoped by role)
- `POST /api/v1/rosters/` - Create individual roster (Admin only)
- `POST /api/v1/rosters/weekly` - Batch assign weekly roster (Admin only)

### Attendance
- `GET /api/v1/attendances/` - List attendance records (scoped by role)
- `POST /api/v1/attendances/` - Record individual attendance (Staff only)
- `POST /api/v1/attendances/bulk` - Mark bulk attendance (Admin/Staff only)

### Invoices
- `GET /api/v1/invoices/` - List invoices (scoped by role)
- `POST /api/v1/invoices/` - Create invoice (Admin only)
- `GET /api/v1/invoices/{invoice_id}` - Get invoice by ID
- `PUT /api/v1/invoices/{invoice_id}` - Update invoice (Admin only)
- `DELETE /api/v1/invoices/{invoice_id}` - Delete invoice (Admin only)
- `POST /api/v1/billing/generate-invoice` - Generate invoice (Admin only)

## Recently Added Views (4 new)
1. **ClientsView.jsx** - `frontend/src/pages/ClientsView.jsx`
   - Client table with company name, contact, email, phone, status badges
   - Search, filtering, add/delete actions
   - API: `GET /api/v1/clients/`

2. **RosterView.jsx** - `frontend/src/pages/RosterView.jsx`
   - Shift roster table per guard with date, shift type (DAY/NIGHT), status
   - Filter by guard, shift type
   - API: `GET /api/v1/guards/` with roster expansion

3. **AttendanceView.jsx** - `frontend/src/pages/AttendanceView.jsx`
   - Attendance records with PRESENT/ABSENT/OVERTIME stats
   - Summary stats grid (PRESENT/ABSENT/OVERTIME counts + total hours)
   - API: `GET /api/v1/attendance/`

4. **InvoicesView.jsx** - `frontend/src/pages/InvoicesView.jsx`
   - Invoices table with client, billing month, amount, status (DRAFT/PAID)
   - Filter by client, status, month
   - Revenue summary section with progress bar
   - API: `GET /api/v1/invoices/`

## Design System
- Tailwind CSS v3 with custom color palette
- lucide-react icons (Shield, Users, MapPin, ClipboardList, ReceiptText, Shield, Calendar, Users, etc.)
- MainLayout sidebar navigation with dashboard, personnel, clients, rosters, attendance, billing
- Consistent glassmorphism panels, tables with hover rows, status badges
- Search/filter controls on all data tables
- Loading skeleton states (animate-pulse pattern)
- Delete confirmations with window.confirm()

## Live Testing
- Frontend: `npm run dev` → `http://localhost:5173`
- Backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000` → `http://localhost:8000`
- Full integration requires backend database (PostgreSQL) with seeded data

## Next Steps
- Start backend server and verify API connectivity
- Test all 5 views (Dashboard + 4 new) in browser
- Verify navigation between views via sidebar
- Test filter/search functionality
- Confirm delete actions work correctly