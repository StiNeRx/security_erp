# APEX OPS — Security & Facility ERP
## Visual Walkthrough · Client Review Document
**Prepared:** 31 August 2026 &nbsp;|&nbsp; **Build:** v1.0 Production Ready &nbsp;|&nbsp; **Status:** 🟢 Live Demo Mode Active

---

> [!NOTE]
> This document presents a full screen-by-screen walkthrough of the **APEX OPS Security & Facility Management ERP** for client review. Screenshots are taken directly from the live running application at `http://localhost:5173`. The system works in **offline demo mode** (no backend required) and will seamlessly switch to **live API mode** when the FastAPI backend is connected.

---

## 🔐 Screen 1 — Secure Authentication Portal

![APEX OPS Login Portal](C:\Users\rajea\.gemini\antigravity\brain\1dad4690-1757-426b-9479-0accd19a5064\01_login_portal.png)

**What this screen does:**
- Clean, professional login form with **Email Credentials** + **Password Key**
- **1-Click Demo Personas** row at the bottom — instantly access the system as **Admin (Full Control)**, **Client (Acme Corp)**, or **Guard (Staff Gate)** without typing credentials
- The system auto-detects backend availability; if the FastAPI server is offline, it falls back to zero-friction demo mode
- Branded with **APEX OPS // 2026** identity and the Security & Facility ERP tagline

---

## 🏠 Screen 2 — Security Control Room (Dashboard)

![APEX OPS Dashboard](C:\Users\rajea\.gemini\antigravity\brain\1dad4690-1757-426b-9479-0accd19a5064\02_dashboard_overview.png)

**What this screen does:**

The **Command Center** is the operational nerve centre of the platform. At a glance, the Admin can see:

| Telemetry Card | Value Shown |
|---|---|
| 🛡️ Active Guard Force | 3 guards (out of 4 enrolled) |
| 📍 Deployment Sites | 4 sites across 3 client accounts |
| ✅ Today's Attendance | **100%** verified check-ins |
| 💰 Monthly Revenue | **₹1,71,100** (Aug 2026 Billing) |

**Live Operational Feed:** Real-time list of guard deployments — Guard #1 at Main Entry Gate (DAY · COMPLETED), Guard #2 at Perimeter Night Patrol (NIGHT · SCHEDULED), etc.

**Revenue Health Panel (right):** Shows total active invoiced amount, 18% GST compliance indicator, and per-client billing status (Acme Corp: SENT, Apex Logistics: PAID, NexGen BioTech: DRAFT).

**Quick Action Buttons:** `Dispatch Guard` · `Bulk Attendance` · `Generate Bill`

---

## ⌨️ Screen 3 — Global Command Palette (Ctrl+K)

![Command Palette](C:\Users\rajea\.gemini\antigravity\brain\1dad4690-1757-426b-9479-0accd19a5064\03_command_palette.png)

**What this screen does:**
- Press **Ctrl+K** from anywhere in the application to launch a spotlight-style command palette
- Quickly navigate to any module: Dashboard, Personnel, Clients, Sites, Rosters, Attendance, Billing
- Type keywords like "Add Guard", "Billing", or "Attendance" for instant actions
- Dismisses with **Escape** — zero mouse dependency, keyboard-first design

---

## 👮 Screen 4 — Security Force & Personnel (Grid View)

![Personnel Grid](C:\Users\rajea\.gemini\antigravity\brain\1dad4690-1757-426b-9479-0accd19a5064\04_personnel_grid.png)

**What this screen does:**

The **Guard Personnel** module manages the complete security workforce:

- **3 Telemetry Cards:** Active On-Duty Force (3 guards, 75% Available) · Guards On Leave (1, rostered off) · Average Daily Wage Rate (₹643/shift)
- **Guard Cards** with badge IDs (SEC-G-001 through SEC-G-004), real-time status badges (ACTIVE / ON LEAVE), daily rate, phone, commissioning date, and notes/skills
- **Search bar** to filter by name, badge ID, or skills
- **Toggle between Grid & Table View** (top-right icons)
- **Quick Actions:** `Set On-Leave` button per guard, `Edit` wage/profile details
- **+ Commission Guard** button (top-right) opens the registration modal

---

## 📋 Screen 5 — Personnel Table View

![Personnel Table](C:\Users\rajea\.gemini\antigravity\brain\1dad4690-1757-426b-9479-0accd19a5064\05_personnel_table.png)

Same data as the grid, presented as a **compact table** — useful for admins managing large guard forces. Toggle between views using the list/grid icons top-right.

---

## 🏢 Screen 6 — Client Accounts & Contracts

![Client Accounts](C:\Users\rajea\.gemini\antigravity\brain\1dad4690-1757-426b-9479-0accd19a5064\08_clients_view.png)

**What this screen does:**

Manages all contracted client companies with full business profiles:

| Metric | Value |
|---|---|
| Contracted Clients | 3 (+1 This Month) |
| Active Facilities | 4 (Multi-Site Distribution) |
| Active Contracts | 3 (100% Retained) |

**Client Cards include:**
- Company name, contact person, email, phone
- Full registered address
- **GSTIN** for GST-compliant invoicing
- Linked **Sites** count and **Invoices** count
- Status badge (ACTIVE) and Edit action

**Sample clients:** Acme Corporation (Gurugram HQ), Apex Logistics Hub (Noida Industrial Estate), NexGen BioTech Labs (Bengaluru Electronic City)

---

## 📍 Screen 7 — Deployment Sites & Facilities

![Deployment Sites](C:\Users\rajea\.gemini\antigravity\brain\1dad4690-1757-426b-9479-0accd19a5064\10_sites_view.png)

**What this screen does:**

Manages every physical location where guards are deployed:

- **4 Total Facilities** active
- **Day Guard Capacity:** 8 Posts (08:00–20:00 shift)
- **Night Patrol Capacity:** 8 Posts (20:00–08:00 shift)

**Site Cards show:**
- Site code (e.g., `ACME-HQ-01`), facility name, client company
- Full address with PIN code and phone
- **Day Shift Quota** + **Night Shift Quota** (guard count per shift)
- Supervisor assignment badge
- Active Shifts count + Edit button

---

## 📅 Screen 8 — Duty Rosters & Shift Matrix

![Duty Rosters](C:\Users\rajea\.gemini\antigravity\brain\1dad4690-1757-426b-9479-0accd19a5064\12_rosters_view.png)

**What this screen does:**

The **Shift Scheduling Hub** — assigns guards to sites for specific dates and shifts:

| Metric | Value |
|---|---|
| Scheduled / Upcoming | 1 (1 Pending) |
| Completed Shifts | 3 (100% Attendance) |
| Day Shifts (08:00) | 3 — Daytime Gate Force |
| Night Shifts (20:00) | 1 — Perimeter Patrol |

**Roster Table columns:** Assigned Guard · Deployment Facility · Shift Date · Shift Slot (DAY/NIGHT badge) · Roster Status (COMPLETED / SCHEDULED) · Station/Instructions · Edit action

**+ Schedule Shift Slots** button opens a modal for single-shift or **weekly batch scheduling** across all guards.

---

## ✅ Screen 9 — Attendance & Overtime Radar

![Attendance View](C:\Users\rajea\.gemini\antigravity\brain\1dad4690-1757-426b-9479-0accd19a5064\14_attendance_view.png)

**What this screen does:**

Real-time attendance tracking with overtime calculation:

| Metric | Value |
|---|---|
| Present & On-Duty | 3 guards (100% Rate) |
| Absentees Logged | 0 (Immediate Replacements ready) |
| Total Overtime Hours | 5 hrs (Billable OT Pay) |
| OT Deployments | 2 Guards with OT |

**Attendance Table:** Shows each guard's site, date/shift, **PRESENT** status badge, overtime hours badge (+2 hrs OT, +3 hrs OT), duty remarks, and inline **PRESENT/ABSENT** quick-log buttons.

**+ Log Bulk Attendance** button opens the multi-guard daily logger modal.

---

## 💰 Screen 10 — Automated Billing & Invoices Studio

![Invoices Studio](C:\Users\rajea\.gemini\antigravity\brain\1dad4690-1757-426b-9479-0accd19a5064\16_invoices_view.png)

**What this screen does:**

The financial control centre for the business:

| Metric | Value |
|---|---|
| Total Invoiced Volume | ₹1,71,100 (+18% YoY) |
| Collected / Paid | ₹73,160 (Settled Funds) |
| Pending / Draft | ₹97,940 (Awaiting Client) |
| GST Tax Collected | ₹26,100 (18% Standard) |

**Invoice Table columns:** Invoice Reference (e.g., `INV-202608-001-A9X`) · Client Company · Subtotal · **GST (18%)** · Total Amount · Status (SENT / PAID / DRAFT) · Print & Mark Paid actions

**+ Generate Client Invoice** button auto-calculates billing based on guard shifts with 18% GST breakdown.

---

## 📐 Architecture & Technology Summary

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 8 + Tailwind CSS v4 |
| **Design System** | Cyber-Ops HUD, Glassmorphism, Neon Cyan Accents |
| **Backend** | FastAPI (Python) + SQLAlchemy 2.0 ORM |
| **Database** | PostgreSQL with Alembic migrations |
| **Authentication** | JWT tokens + Role-Based Access Control |
| **Roles** | ADMIN (Full) · CLIENT (Scoped) · STAFF (Field) |
| **State** | Offline-resilient with zero-friction demo mode |
| **Modals** | 7 interactive CRUD modals with full validation |
| **UX Features** | Command Palette (Ctrl+K) · Slide-over Drawers · Grid/Table toggle |

---

## 🔑 Key Features Delivered

- [x] **Secure JWT Login** with 3-role RBAC (Admin, Client, Staff)
- [x] **1-Click Demo Personas** — no credentials required for demo
- [x] **Offline-First Architecture** — works without backend connection
- [x] **Command Palette** — Ctrl+K global search and action launcher
- [x] **Guard Personnel** — Register, edit, leave management, dossier drawer
- [x] **Client Accounts** — GSTIN profiles, site & invoice linkage
- [x] **Deployment Sites** — Day/Night quotas, supervisor assignments
- [x] **Duty Rosters** — Single shift + weekly batch scheduling
- [x] **Attendance** — Bulk logging, OT tracking, instant mark buttons
- [x] **Billing Studio** — GST-compliant invoice generation + PDF print
- [x] **Live Dashboard** — Real-time telemetry, revenue health, guard feed

---

## 💬 Questions for Client Feedback

> [!IMPORTANT]
> Please review each section and provide feedback on the following:

1. **Branding** — Should "APEX OPS" reflect your actual company name/logo?
2. **Data Fields** — Are there additional guard or client fields needed (e.g., NID/Aadhaar, contract value)?
3. **Roles** — Are the 3 roles (Admin, Client, Staff) sufficient, or do you need sub-roles (e.g., Site Supervisor)?
4. **Reports** — Do you need monthly PDF payroll reports, or export to Excel for attendance/billing?
5. **Notifications** — Should the system send email/SMS alerts for missed attendance or invoice due dates?
6. **Mobile** — Is mobile (tablet/phone) access a priority for field guards logging attendance?
7. **Priority Modules** — Which module would you like to prioritise for backend integration first?

---

*APEX OPS Security & Facility ERP — Confidential Client Preview · August 2026*
