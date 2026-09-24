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

export const INITIAL_CANDIDATES = [
  {
    id: 1,
    intimation_id: "INT-2026-1042",
    full_name: "Amitabh Sen",
    phone: "+91-9811223344",
    email: "amitabh.sen@example.com",
    vertical: "SECURITY",
    category: "GUNMAN",
    status: "VERIFIED",
    dob: "1994-06-12",
    gender: "MALE",
    address: "Dehradun, Uttarakhand",
    screening_notes: "Ex-serviceman with valid arms license. Verified background.",
    documents: { arms_license: true, police_verification: true },
    created_at: "2026-03-10T10:00:00Z"
  },
  {
    id: 2,
    intimation_id: "INT-2026-2189",
    full_name: "Sunita Rawat",
    phone: "+91-9877665544",
    email: "sunita.rawat@example.com",
    vertical: "NURSING",
    category: "NURSE_ASSISTANT",
    status: "APPLIED",
    dob: "1997-09-24",
    gender: "FEMALE",
    address: "Haridwar, Uttarakhand",
    screening_notes: "Certified GDA (General Duty Assistant) with 2 years clinical facility experience.",
    documents: { nursing_cert: true },
    created_at: "2026-03-14T11:30:00Z"
  },
  {
    id: 3,
    intimation_id: "INT-2026-3401",
    full_name: "Karan Bahadur",
    phone: "+91-9812345678",
    email: "karan.b@example.com",
    vertical: "HOUSEKEEPING",
    category: "JANITOR",
    status: "APPLIED",
    dob: "1999-01-15",
    gender: "MALE",
    address: "Noida, Sector 62, UP",
    screening_notes: "Hospital grade sanitization and industrial machine operation experience.",
    documents: {},
    created_at: "2026-03-16T14:15:00Z"
  }
];

export const INITIAL_GUARDS = [
  {
    id: 1,
    user_id: 8,
    badge_number: "FORT-SEC-001",
    intimation_id: "INT-2026-8001",
    vertical: "SECURITY",
    category: "HEAD_GUARD",
    daily_rate: 750.0,
    status: "ACTIVE",
    emergency_contact: "+91-9123456780",
    joining_date: "2025-01-15",
    aadhaar_number: "2345-6789-0123",
    pan_number: "ABCDE1234F",
    bank_account_no: "50100456789012",
    bank_name: "HDFC Bank",
    bank_ifsc: "HDFC0001024",
    police_verification_expiry: "2026-11-30",
    medical_fitness_expiry: "2026-12-15",
    psara_cert_no: "PSARA-UK-2024-9912",
    uniform_issued_items: ["Shirt", "Trousers", "Shoes", "Belt", "Cap"],
    uniform_total_cost: 3200.0,
    uniform_monthly_emi: 400.0,
    uniform_balance_due: 1200.0,
    is_bench_locked: false,
    bench_lock_reason: null,
    notes: "Lead Gate Supervisor. Certified in First Aid & Fire Safety.",
    created_at: "2025-01-15T00:00:00Z",
    user: {
      id: 8,
      email: "guard@fortellus.com",
      full_name: "Field Guard (Vikram)",
      phone_number: "+91-9000000008",
      role: "STAFF",
      is_active: true
    }
  },
  {
    id: 2,
    user_id: 4,
    badge_number: "FORT-SEC-002",
    intimation_id: "INT-2026-8002",
    vertical: "SECURITY",
    category: "GUNMAN",
    daily_rate: 950.0,
    status: "ACTIVE",
    emergency_contact: "+91-9123456781",
    joining_date: "2025-03-01",
    aadhaar_number: "3456-7890-1234",
    pan_number: "FGHIJ5678K",
    bank_account_no: "60200112233445",
    bank_name: "State Bank of India",
    bank_ifsc: "SBIN0004567",
    arms_license_no: "ARMS-NCR-2023-8871",
    arms_caliber: ".32 Revolver",
    arms_weapon_serial: "WP-99214A",
    arms_ammunition_count: 12,
    arms_expiry_date: "2026-10-15",
    police_verification_expiry: "2026-10-30",
    medical_fitness_expiry: "2026-11-20",
    uniform_issued_items: ["Shirt", "Trousers", "Shoes", "Holster", "Cap"],
    uniform_total_cost: 3800.0,
    uniform_monthly_emi: 450.0,
    uniform_balance_due: 1550.0,
    is_bench_locked: false,
    bench_lock_reason: null,
    notes: "Armed guard assigned to cash-transit / perimeter security.",
    created_at: "2025-03-01T00:00:00Z",
    user: {
      id: 4,
      email: "guard.gunman@fortellus.com",
      full_name: "Surendra Rawat (Gunman)",
      phone_number: "+91-9876543213",
      role: "STAFF",
      is_active: true
    }
  },
  {
    id: 3,
    user_id: 5,
    badge_number: "FORT-HK-003",
    intimation_id: "INT-2026-8003",
    vertical: "HOUSEKEEPING",
    category: "HOUSEKEEPER",
    daily_rate: 550.0,
    status: "ACTIVE",
    emergency_contact: "+91-9123456782",
    joining_date: "2025-02-15",
    aadhaar_number: "4567-8901-2345",
    pan_number: "KLMNO9012P",
    bank_account_no: "10987654321098",
    bank_name: "Punjab National Bank",
    bank_ifsc: "PUNB0123400",
    police_verification_expiry: "2026-09-30",
    medical_fitness_expiry: "2026-12-01",
    uniform_issued_items: ["Apron", "Trousers", "Shoes", "Gloves"],
    uniform_total_cost: 1800.0,
    uniform_monthly_emi: 300.0,
    uniform_balance_due: 600.0,
    is_bench_locked: false,
    bench_lock_reason: null,
    notes: "Corporate facility deep cleaning & waste management.",
    created_at: "2025-02-15T00:00:00Z",
    user: {
      id: 5,
      email: "staff.hk@fortellus.com",
      full_name: "Anita Devi",
      phone_number: "+91-9876543214",
      role: "STAFF",
      is_active: true
    }
  },
  {
    id: 4,
    user_id: 6,
    badge_number: "FORT-NUR-004",
    intimation_id: "INT-2026-8004",
    vertical: "NURSING",
    category: "NURSE_ASSISTANT",
    daily_rate: 850.0,
    status: "BENCH",
    emergency_contact: "+91-9123456783",
    joining_date: "2025-03-10",
    aadhaar_number: "5678-9012-3456",
    pan_number: "QRSTU3456V",
    bank_account_no: "98765432101234",
    bank_name: "ICICI Bank",
    bank_ifsc: "ICIC0002345",
    police_verification_expiry: "2026-02-01", // Expired!
    medical_fitness_expiry: "2026-08-01",
    uniform_issued_items: ["Medical Scrubs", "Shoes", "ID Badge"],
    uniform_total_cost: 2200.0,
    uniform_monthly_emi: 350.0,
    uniform_balance_due: 800.0,
    is_bench_locked: true,
    bench_lock_reason: "Police verification expired on 2026-02-01",
    notes: "Geriatric & patient care attendant. Locked to Bench until police renewal.",
    created_at: "2025-03-10T00:00:00Z",
    user: {
      id: 6,
      email: "staff.nursing@fortellus.com",
      full_name: "Pooja Negi (GDA)",
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
