from fastapi.testclient import TestClient
from tests.conftest import get_token_headers


def test_admin_can_create_and_list_clients(client: TestClient, seeded_data):
    """Test Admin can create a new client and list all clients."""
    headers = get_token_headers(seeded_data["admin"].id)

    # 1. Create new client
    payload = {
        "company_name": "Zenith Commercial Hub",
        "contact_person": "Jane Zenith",
        "contact_email": "jane@zenith.com",
        "contact_phone": "+91-9876500000",
        "billing_address": "404 Cyber Park",
        "gst_number": "06ZZZZZ0000A1Z9",
        "is_active": True,
    }
    response = client.post("/api/v1/clients/", json=payload, headers=headers)
    assert response.status_code == 201
    created_client = response.json()
    assert created_client["company_name"] == "Zenith Commercial Hub"

    # 2. List all clients
    list_res = client.get("/api/v1/clients/", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 3


def test_client_cannot_create_client_and_views_only_own(client: TestClient, seeded_data):
    """Test Client user cannot create clients and only sees their own company."""
    client1_headers = get_token_headers(seeded_data["client_user1"].id)

    # 1. Try to create client -> 403 Forbidden
    payload = {
        "company_name": "Illegal Company",
        "contact_person": "Scammer",
        "contact_email": "scam@test.com",
        "contact_phone": "+91-0000000000",
        "billing_address": "Nowhere",
    }
    response = client.post("/api/v1/clients/", json=payload, headers=client1_headers)
    assert response.status_code == 403

    # 2. List clients -> only sees own company (Apex Logistics Ltd)
    list_res = client.get("/api/v1/clients/", headers=client1_headers)
    assert list_res.status_code == 200
    clients_data = list_res.json()
    assert len(clients_data) == 1
    assert clients_data[0]["company_name"] == "Apex Logistics Ltd"

    # 3. Try to view company2 directly -> 403 Forbidden
    company2_id = seeded_data["company2"].id
    res_company2 = client.get(f"/api/v1/clients/{company2_id}", headers=client1_headers)
    assert res_company2.status_code == 403


def test_admin_can_create_and_list_sites(client: TestClient, seeded_data):
    """Test Admin can create sites and view all sites."""
    headers = get_token_headers(seeded_data["admin"].id)
    company1_id = seeded_data["company1"].id

    payload = {
        "client_id": company1_id,
        "site_name": "Apex Factory Unit 2",
        "site_code": "APEX-FAC-02",
        "address": "Sector 34, Manesar",
        "city": "Gurugram",
        "state": "Haryana",
        "postal_code": "122050",
        "shift_requirements": {"day_shift_guards": 3, "night_shift_guards": 3},
        "is_active": True,
    }
    response = client.post("/api/v1/sites/", json=payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["site_code"] == "APEX-FAC-02"

    list_res = client.get("/api/v1/sites/", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 3


def test_client_cannot_create_site_and_views_only_own_sites(client: TestClient, seeded_data):
    """Test Client cannot create sites and queries only their own sites."""
    client1_headers = get_token_headers(seeded_data["client_user1"].id)
    company1_id = seeded_data["company1"].id

    # 1. Try to create site -> 403 Forbidden
    payload = {
        "client_id": company1_id,
        "site_name": "Client Created Site",
        "address": "Some Street",
        "city": "Delhi",
        "state": "Delhi",
        "postal_code": "110001",
    }
    response = client.post("/api/v1/sites/", json=payload, headers=client1_headers)
    assert response.status_code == 403

    # 2. List sites -> only sites belonging to Company 1
    list_res = client.get("/api/v1/sites/", headers=client1_headers)
    assert list_res.status_code == 200
    sites = list_res.json()
    assert len(sites) == 1
    assert sites[0]["site_code"] == "APEX-WH-01"

    # 3. Try to view site2 (Beacon Shopping Mall) -> 403 Forbidden
    site2_id = seeded_data["site2"].id
    res_site2 = client.get(f"/api/v1/sites/{site2_id}", headers=client1_headers)
    assert res_site2.status_code == 403


def test_staff_cannot_create_site_or_guard(client: TestClient, seeded_data):
    """Test Staff guard accounts cannot create sites or guard profiles."""
    staff_headers = get_token_headers(seeded_data["guard_user1"].id)

    # 1. Try to create site -> 403
    res_site = client.post(
        "/api/v1/sites/",
        json={"client_id": 1, "site_name": "Bad Site", "address": "X", "city": "Y", "state": "Z", "postal_code": "000000"},
        headers=staff_headers,
    )
    assert res_site.status_code == 403

    # 2. Try to create guard profile -> 403
    res_guard = client.post(
        "/api/v1/guards/",
        json={"user_id": 2, "badge_number": "SEC-999", "daily_rate": "500.00"},
        headers=staff_headers,
    )
    assert res_guard.status_code == 403
