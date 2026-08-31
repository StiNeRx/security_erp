from decimal import Decimal
from fastapi.testclient import TestClient
from tests.conftest import get_token_headers


def test_generate_invoice_endpoint(client: TestClient, seeded_data):
    """Test generating a client invoice automatically aggregates monthly shifts and applies 18% GST."""
    admin_headers = get_token_headers(seeded_data["admin"].id)
    company1_id = seeded_data["company1"].id
    site1_id = seeded_data["site1"].id
    guard1_id = seeded_data["guard_profile1"].id
    guard2_id = seeded_data["guard_profile2"].id

    # 1. Schedule more shifts for Company 1 in August 2026
    # Day 1: Guard 1 -> PRESENT (rate 700) + 2h OT (200) -> 900
    # Day 2: Guard 2 -> HALF_DAY (rate 650 * 0.5 = 325) -> 325
    client.post(
        "/api/v1/rosters/weekly",
        json={
            "site_id": site1_id,
            "start_date": "2026-08-11",
            "end_date": "2026-08-12",
            "assignments": [
                {"guard_id": guard1_id, "date": "2026-08-11", "shift_type": "DAY"},
                {"guard_id": guard2_id, "date": "2026-08-12", "shift_type": "DAY"},
            ],
        },
        headers=admin_headers,
    )

    # 2. Call /billing/generate-invoice for August 2026
    payload = {
        "client_id": company1_id,
        "billing_month": "2026-08",
        "tax_rate": "18.00",
        "rate_per_shift": "800.00",  # Flat billing rate to client: 800 per shift
        "overtime_hourly_rate": "120.00",
        "notes": "August 2026 Security Deployment at Apex Warehouse",
    }

    response = client.post("/api/v1/billing/generate-invoice", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()

    assert data["client_name"] == "Apex Logistics Ltd"
    assert data["billing_month"] == "2026-08"
    assert float(data["total_billable_shifts"]) >= 3.0
    assert "breakdown_by_site" in data
    assert len(data["breakdown_by_site"]) == 1
    assert data["breakdown_by_site"][0]["site_name"] == "Apex Warehouse Hub"

    invoice = data["invoice"]
    assert invoice["client_id"] == company1_id
    assert invoice["billing_month"] == "2026-08"
    assert float(invoice["subtotal"]) > 0
    assert float(invoice["tax_rate"]) == 18.00
    assert float(invoice["tax_amount"]) > 0
    assert float(invoice["total_amount"]) == round(float(invoice["subtotal"]) + float(invoice["tax_amount"]), 2)


def test_client_cannot_generate_invoice_but_views_own(client: TestClient, seeded_data):
    """Test Client cannot trigger invoice generation but can view their own generated invoices."""
    client1_headers = get_token_headers(seeded_data["client_user1"].id)
    company1_id = seeded_data["company1"].id

    # 1. Try to generate invoice -> 403 Forbidden
    payload = {
        "client_id": company1_id,
        "billing_month": "2026-08",
    }
    res_gen = client.post("/api/v1/billing/generate-invoice", json=payload, headers=client1_headers)
    assert res_gen.status_code == 403

    # 2. View invoices list -> sees only Company 1 invoices
    res_list = client.get("/api/v1/invoices/", headers=client1_headers)
    assert res_list.status_code == 200
    invoices = res_list.json()
    assert len(invoices) >= 1
    for inv in invoices:
        assert inv["client_id"] == company1_id


def test_staff_cannot_view_invoices(client: TestClient, seeded_data):
    """Test Staff account receives 403 Forbidden when attempting to view invoices."""
    staff_headers = get_token_headers(seeded_data["guard_user1"].id)
    response = client.get("/api/v1/invoices/", headers=staff_headers)
    assert response.status_code == 403
