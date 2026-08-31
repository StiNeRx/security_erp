You are the Lead Full-Stack Engineer for the Security & Facility Management ERP located in `D:\Clients_works\security_erp`. 

Execute the project setup autonomously using the phase-based workflow below. If an action requires multiple turns or hits context limits, complete the active phase, update `PROGRESS.md`, and log what needs to be done next.

---

### PHASE 1: DISCOVERY & AUDIT
1. Scan the filesystem at `D:\Clients_works\security_erp`.
2. Inspect any existing files in `backend/` and `frontend/`.
3. Create or update `PROGRESS.md` in the root folder with a detailed checklist containing:
   - [ ] Backend State (SQLAlchemy models, FastAPI routes, JWT auth)
   - [ ] Database Setup (Connection configs, requirements.txt)
   - [ ] Frontend Setup (Vite React, Tailwind CSS, Axios API instance)
   - [ ] Component Mapping (Clients, Sites, Duty Rosters, Attendance, Invoices)

---

### PHASE 2: BACKEND COMPLETION & SCHEMA VERIFICATION
1. Verify or create the FastAPI backend in `backend/` with SQLAlchemy models:
   - `User` (roles: ADMIN, CLIENT, STAFF)
   - `Client` & `Site` (location & contract details)
   - `GuardProfile` & `ShiftRoster` (guard allocations & shifts)
   - `Attendance` (daily status, overtime)
   - `Invoice` (monthly billing)
2. Ensure JWT authentication (`routers/auth.py`) and CRUD endpoints (`routers/`) are structured correctly.
3. Write/verify `backend/requirements.txt` (`fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `python-jose`, `passlib`).

---

### PHASE 3: FRONTEND SETUP & API INTEGRATION
1. Check `frontend/`. If not present, initialize a Vite React application with Tailwind CSS inside `frontend/`.
2. Install `axios` and `react-router-dom` using terminal commands.
3. Create `frontend/src/api.js` configured with Axios pointing to `http://localhost:8000`, including request interceptors to automatically attach JWT tokens.

---

### PHASE 4: UI COMPONENT BUILD & ENDPOINT MAPPING
Build the React UI components inside `frontend/src/pages/` and map them to their respective FastAPI endpoints:
1. `Login.jsx` $\rightarrow$ Auth endpoint (`/auth/login`)
2. `DashboardLayout.jsx` $\rightarrow$ Main sidebar navigation shell
3. `ClientsView.jsx` $\rightarrow$ CRUD endpoints (`/clients`, `/sites`)
4. `RosterView.jsx` $\rightarrow$ Shift assignment grid (`/rosters`)
5. `AttendanceView.jsx` $\rightarrow$ Bulk daily attendance logger (`/attendance`)
6. `InvoicesView.jsx` $\rightarrow$ Monthly invoice generator (`/billing/generate-invoice`)

---

### PHASE 5: PROGRESS LOGGING
At the end of every execution phase or before pausing, check off completed tasks in `PROGRESS.md` so the project status is preserved across sessions.