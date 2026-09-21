/**
 * High-fidelity fallback demo dataset — Fortellus Enterprise ERP v2.0
 * Mirrors the seeded Supabase accounts exactly (all passwords: auth0000).
 */

export const INITIAL_USERS = [
  {
    id: 1,
    email: "owner@fortellus.com",
    full_name: "Fortellus Owner",
    phone_number: "+91-9000000001",
    role: "OWNER",
    is_active: true,
    is_superuser: true,
    created_at: "2026-01-01T00:00:00Z"
  },
  {
    id: 2,
    email: "superadmin@fortellus.com",
    full_name: "Super Administrator",
    phone_number: "+91-9000000002",
    role: "SUPER_ADMIN",
    is_active: true,
    is_superuser: true,
    created_at: "2026-01-01T00:00:00Z"
  },
  {
    id: 3,
    email: "hr@fortellus.com",
    full_name: "HR Manager",
    phone_number: "+91-9000000003",
    role: "HR",
    is_active: true,
    is_superuser: false,
    created_at: "2026-01-01T00:00:00Z"
  },
  {
    id: 4,
    email: "operations@fortellus.com",
    full_name: "Operations Manager",
    phone_number: "+91-9000000004",
    role: "OPERATIONS",
    is_active: true,
    is_superuser: false,
    created_at: "2026-01-01T00:00:00Z"
  },
  {
    id: 5,
    email: "accounts@fortellus.com",
    full_name: "Accounts Manager",
    phone_number: "+91-9000000005",
    role: "ACCOUNTS",
    is_active: true,
    is_superuser: false,
    created_at: "2026-01-01T00:00:00Z"
  },
  {
    id: 6,
    email: "supervisor@fortellus.com",
    full_name: "Field Supervisor",
    phone_number: "+91-9000000006",
    role: "SUPERVISOR",
    is_active: true,
    is_superuser: false,
    created_at: "2026-01-01T00:00:00Z"
  },
  {
    id: 7,
    email: "client@techpark.com",
    full_name: "TechPark Client POC",
    phone_number: "+91-9000000007",
    role: "CLIENT",
    is_active: true,
    is_superuser: false,
    created_at: "2026-01-10T00:00:00Z"
  },
  {
    id: 8,
    email: "guard@fortellus.com",
    full_name: "Field Guard",
    phone_number: "+91-9000000008",
    role: "STAFF",
    is_active: true,
    is_superuser: false,
    created_at: "2026-01-15T00:00:00Z"
  },
  {
    role: "STAFF",
    is_active: true,
    is_superuser: false,
    created_at: "2026-02-15T00:00:00Z"
  },
  {
    id: 6,
    email: "guard.anita@securityerp.com",
    full_name: "Anita Verma",
    phone_number: "+91-9876543215",
    role: "STAFF",
    is_active: true,
    is_superuser: false,
    created_at: "2026-03-01T00:00:00Z"
  }
];

export const INITIAL_CLIENTS = [
  {
    id: 1,
    user_id: 2,
    company_name: "Acme Corporation",
    contact_person: "John Doe",
    contact_email: "client.manager@acmecorp.com",
    contact_phone: "+91-9876543211",
    billing_address: "Tower A, 5th Floor, Cyber City, Gurugram, Haryana, 122002",
    gst_number: "06AAAAA0000A1Z5",
    is_active: true,
    created_at: "2026-01-10T00:00:00Z"
  },
  {
    id: 2,
    user_id: null,
    company_name: "Apex Logistics Hub",
    contact_person: "Priya Menon",
    contact_email: "operations@apexlogistics.in",
    contact_phone: "+91-9988776655",
    billing_address: "Sector 18, Industrial Estate, Noida, Uttar Pradesh, 201301",
    gst_number: "09BBBBB1111B2Z6",
    is_active: true,
    created_at: "2026-02-05T00:00:00Z"
  },
  {
    id: 3,
    user_id: null,
    company_name: "NexGen BioTech Labs",
    contact_person: "Dr. Rahul Joshi",
    contact_email: "security@nexgenbio.com",
    contact_phone: "+91-9123456789",
    billing_address: "Biotech Park, Phase 3, Electronic City, Bengaluru, Karnataka, 560100",
    gst_number: "29CCCCC2222C3Z7",
    is_active: true,
    created_at: "2026-03-12T00:00:00Z"
  }
];

export const INITIAL_SITES = [
  {
    id: 1,
    client_id: 1,
    site_name: "Acme Corporate HQ",
    site_code: "ACME-HQ-01",
    address: "Plot 101, Phase 2, Udyog Vihar",
    city: "Gurugram",
    state: "Haryana",
    postal_code: "122016",
    shift_requirements: {
      day_shift_guards: 2,
      night_shift_guards: 2,
      supervisor_required: true
    },
    contact_phone: "+91-124-4567890",
    is_active: true,
    created_at: "2026-01-12T00:00:00Z"
  },
  {
    id: 2,
    client_id: 1,
    site_name: "Acme R&D Center",
    site_code: "ACME-RD-02",
    address: "Tech Zone IV, Greater Noida",
    city: "Noida",
    state: "Uttar Pradesh",
    postal_code: "201306",
    shift_requirements: {
      day_shift_guards: 1,
      night_shift_guards: 2,
      supervisor_required: false
    },
    contact_phone: "+91-120-9876543",
    is_active: true,
    created_at: "2026-02-01T00:00:00Z"
  },
  {
    id: 3,
    client_id: 2,
    site_name: "Apex Central Warehouse",
    site_code: "APEX-WH-01",
    address: "NH-8 Logistics Corridor",
    city: "Manesar",
    state: "Haryana",
    postal_code: "122051",
    shift_requirements: {
      day_shift_guards: 3,
      night_shift_guards: 3,
      supervisor_required: true
    },
    contact_phone: "+91-124-1122334",
    is_active: true,
    created_at: "2026-02-10T00:00:00Z"
  },
  {
    id: 4,
    client_id: 3,
    site_name: "NexGen Bio Campus",
    site_code: "NXG-BIO-01",
    address: "Block 4, Electronic City",
    city: "Bengaluru",
    state: "Karnataka",
    postal_code: "560100",
    shift_requirements: {
      day_shift_guards: 2,
      night_shift_guards: 1,
      supervisor_required: true
    },
    contact_phone: "+91-80-44556677",
    is_active: true,
    created_at: "2026-03-15T00:00:00Z"
  }
];

export const INITIAL_GUARDS = [
  {
    id: 1,
    user_id: 3,
    badge_number: "SEC-G-001",
    daily_rate: 650.0,
    status: "ACTIVE",
    emergency_contact: "+91-9123456780",
    joining_date: "2025-01-15",
    notes: "Lead Gate Supervisor. Certified in First Aid & Fire Safety.",
    created_at: "2025-01-15T00:00:00Z",
    user: {
      id: 3,
      email: "guard.ramesh@securityerp.com",
      full_name: "Ramesh Kumar",
      phone_number: "+91-9876543212",
      role: "STAFF",
      is_active: true
    }
  },
  {
    id: 2,
    user_id: 4,
    badge_number: "SEC-G-002",
    daily_rate: 600.0,
    status: "ACTIVE",
    emergency_contact: "+91-9123456781",
    joining_date: "2025-03-01",
    notes: "Certified for CCTV monitoring and night perimeter patrol.",
    created_at: "2025-03-01T00:00:00Z",
    user: {
      id: 4,
      email: "guard.suresh@securityerp.com",
      full_name: "Suresh Singh",
      phone_number: "+91-9876543213",
      role: "STAFF",
      is_active: true
    }
  },
  {
    id: 3,
    user_id: 5,
    badge_number: "SEC-G-003",
    daily_rate: 700.0,
    status: "ACTIVE",
    emergency_contact: "+91-9123456782",
    joining_date: "2025-02-15",
    notes: "Specialized in VIP escort and access control protocols.",
    created_at: "2025-02-15T00:00:00Z",
    user: {
      id: 5,
      email: "guard.vikram@securityerp.com",
      full_name: "Vikram Sharma",
      phone_number: "+91-9876543214",
      role: "STAFF",
      is_active: true
    }
  },
  {
    id: 4,
    user_id: 6,
    badge_number: "SEC-G-004",
    daily_rate: 620.0,
    status: "ON_LEAVE",
    emergency_contact: "+91-9123456783",
    joining_date: "2025-03-10",
    notes: "Front lobby guest verification specialist.",
    created_at: "2025-03-10T00:00:00Z",
    user: {
      id: 6,
      email: "guard.anita@securityerp.com",
      full_name: "Anita Verma",
      phone_number: "+91-9876543215",
      role: "STAFF",
      is_active: true
    }
  }
];

const todayStr = new Date().toISOString().split("T")[0];

export const INITIAL_ROSTERS = [
  {
    id: 1,
    site_id: 1,
    guard_id: 1,
    date: todayStr,
    shift_type: "DAY",
    status: "COMPLETED",
    notes: "Main Entry Gate 1",
    created_at: "2026-08-30T00:00:00Z"
  },
  {
    id: 2,
    site_id: 1,
    guard_id: 2,
    date: todayStr,
    shift_type: "NIGHT",
    status: "SCHEDULED",
    notes: "Perimeter Night Patrol",
    created_at: "2026-08-30T00:00:00Z"
  },
  {
    id: 3,
    site_id: 2,
    guard_id: 3,
    date: todayStr,
    shift_type: "DAY",
    status: "COMPLETED",
    notes: "Visitor Access Desk",
    created_at: "2026-08-30T00:00:00Z"
  },
  {
    id: 4,
    site_id: 3,
    guard_id: 1,
    date: "2026-08-29",
    shift_type: "DAY",
    status: "COMPLETED",
    notes: "Warehouse Gate A",
    created_at: "2026-08-28T00:00:00Z"
  }
];

export const INITIAL_ATTENDANCE = [
  {
    id: 1,
    roster_id: 1,
    guard_name: "Ramesh Kumar",
    guard_badge: "SEC-G-001",
    site_name: "Acme Corporate HQ",
    date: todayStr,
    shift_type: "DAY",
    status: "PRESENT",
    check_in_time: `${todayStr}T08:00:00Z`,
    check_out_time: `${todayStr}T18:00:00Z`,
    overtime_hours: 2.0,
    remarks: "Extra 2 hours VIP Escort"
  },
  {
    id: 2,
    roster_id: 3,
    guard_name: "Vikram Sharma",
    guard_badge: "SEC-G-003",
    site_name: "Acme R&D Center",
    date: todayStr,
    shift_type: "DAY",
    status: "PRESENT",
    check_in_time: `${todayStr}T08:15:00Z`,
    check_out_time: `${todayStr}T17:00:00Z`,
    overtime_hours: 0.0,
    remarks: "On time deployment"
  },
  {
    id: 3,
    roster_id: 4,
    guard_name: "Ramesh Kumar",
    guard_badge: "SEC-G-001",
    site_name: "Apex Central Warehouse",
    date: "2026-08-29",
    shift_type: "DAY",
    status: "PRESENT",
    check_in_time: "2026-08-29T07:55:00Z",
    check_out_time: "2026-08-29T19:00:00Z",
    overtime_hours: 3.0,
    remarks: "Inventory count supervision"
  }
];

export const INITIAL_INVOICES = [
  {
    id: 1,
    client_id: 1,
    client_name: "Acme Corporation",
    invoice_number: "INV-202608-001-A9X",
    billing_month: "2026-08",
    issue_date: todayStr,
    due_date: "2026-09-15",
    subtotal: 45000.0,
    tax_rate: 18.0,
    tax_amount: 8100.0,
    total_amount: 53100.0,
    status: "SENT",
    notes: "Security deployment for August 2026 at Acme Corporate HQ & R&D.",
    created_at: "2026-08-30T00:00:00Z"
  },
  {
    id: 2,
    client_id: 2,
    client_name: "Apex Logistics Hub",
    invoice_number: "INV-202607-002-K3F",
    billing_month: "2026-07",
    issue_date: "2026-08-01",
    due_date: "2026-08-15",
    subtotal: 62000.0,
    tax_rate: 18.0,
    tax_amount: 11160.0,
    total_amount: 73160.0,
    status: "PAID",
    notes: "Warehouse 24/7 security guard deployments.",
    created_at: "2026-08-01T00:00:00Z"
  },
  {
    id: 3,
    client_id: 3,
    client_name: "NexGen BioTech Labs",
    invoice_number: "INV-202608-003-M8Q",
    billing_month: "2026-08",
    issue_date: todayStr,
    due_date: "2026-09-14",
    subtotal: 38000.0,
    tax_rate: 18.0,
    tax_amount: 6840.0,
    total_amount: 44840.0,
    status: "DRAFT",
    notes: "Cleanroom and campus security for August.",
    created_at: "2026-08-31T00:00:00Z"
  }
];
