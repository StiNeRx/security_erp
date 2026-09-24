# Fortellus Enterprise ERP — Implementation Progress

## Status Overview
- **Project**: Fortellus Security & Facility Management ERP (v2.0)
- **Database**: Supabase PostgreSQL (`aws-0-ap-southeast-2.pooler.supabase.com:5432`)
- **Initial Owner Account**: `owner@fortellus.com` (password: `auth0000`, role: `OWNER`)

---

### Phase 1: Brand Unification & Granular RBAC Foundation — [COMPLETED]
- [x] Connected development and production environment to client's Supabase PostgreSQL instance.
- [x] Created all relational tables live in Supabase: `users`, `clients`, `sites`, `guard_profiles`, `shift_rosters`, `attendances`, `invoices`.
- [x] Seeded initial production Owner account (`owner@fortellus.com` / `auth0000`) and standard Fortellus enterprise personas.
- [x] Expanded backend `UserRole` enums: `OWNER`, `SUPER_ADMIN`, `HR`, `OPERATIONS`, `ACCOUNTS`, `SUPERVISOR`, `CLIENT`, `STAFF`.
- [x] Updated RBAC security dependencies (`deps.py`) with role hierarchy and token claim encoding.
- [x] Rebranded frontend headers, titles (`Fortellus ERP`), and login screen.
- [x] Added 1-click persona quick-fills on login and header role switcher.
- [x] Verified frontend build passes cleanly (`npm run build`).

---

### Phase 2: Multi-Vertical Staff Master & Compliance Bench-Locking — [COMPLETED]
- [x] Implemented multi-vertical categories: `SECURITY`, `HOUSEKEEPING`, `NURSING`.
- [x] Built Recruitment Pipeline: `APPLIED` -> `VERIFIED` -> `ONBOARDED` (auto-creates Staff record with Intimation ID).
- [x] Implemented KYC, Aadhaar, PAN, Bank Account & IFSC lookup validation.
- [x] Added Arms details (License No, Caliber, Expiry, Ammo) and Uniform EMI deduction calculator.
- [x] Enforced automated Compliance Expiry: Police Verification 45-day alert, Gun License 60-day warning.
- [x] Implemented Automated Bench Locking: lock expired/missing documents to `BENCH` status and prevent roster deployment.
- [x] Synchronized schema live with Supabase (`recruitment_candidates` table and `guard_profiles` columns).
- [x] Upgraded frontend `Personnel.jsx` (Staff Master, Recruitment Pipeline, Compliance Radar, and Bench-lock warnings).


---

### Phase 3: Client Master, Dynamic Contracts & Deployment Roster Engine — [PENDING]
- [ ] 15-digit GSTIN regex validation on client creation.
- [ ] Multi-site dynamic contract rates and 30-60 day contract expiry tracking.
- [ ] Automated Deployment Roster Engine with shift overlap collision prevention.
- [ ] Real-time Shortfall Index ($G_s = 1 - N_{active}/N_{required}$) and auto-bench suggestions.

---

### Phase 4: GPS Geofenced Attendance & Field Verification Engine — [PENDING]
- [ ] Server-side Haversine distance geofencing ($R \le 100\text{m}$) against site coordinates.
- [ ] Mobile/browser device binding protocol to prevent proxy check-in.
- [ ] Real-time attendance hours and overtime auto-sync to payroll accumulator.

---

### Phase 5: Automated Statutory Payroll & Tax Invoicing (GST/ITC) — [PENDING]
- [ ] Statutory payroll engine: Basic, HRA, PF @ 12%, ESIC @ 0.75%, LWF, Uniform EMI recovery, Net Pay.
- [ ] Salary Status Lifecycle (`DRAFT` -> `CALCULATED` -> `APPROVED` -> `DISBURSED`) and Salary Hold Engine.
- [ ] Verified attendance-driven tax invoicing with CGST/SGST/IGST breakdown.
- [ ] Output GST Collection Ledger and Input Tax Credit (ITC) Ledger for GSTR-2B reconciliation.

---

### Phase 6: Owner Executive Command Center, Real-Time P&L & Risk Radar — [PENDING]
- [ ] Restricted Owner Executive Dashboard (`/owner-executive`) strictly for `OWNER` role.
- [ ] Dynamic Net Margin Formula:
  $$M_s = \frac{\sum R_{billed,i} - \sum (S_{base,i} + O_{overtime,i} + C_{statutory,i} + P_{penalties,i})}{\sum R_{billed,i}} \times 100$$
- [ ] Master Balance Sheet, Cash Flow Tracker, and Corporate Tax/Compliance filing matrix.
- [ ] Automated System Red-Flags & Risk Dashboard (Financial, Compliance, Operational).