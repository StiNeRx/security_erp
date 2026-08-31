from datetime import date
from fastapi.testclient import TestClient
from tests.conftest import get_token_headers


def test_admin_can_assign_weekly_roster(client: TestClient, seeded_data):
    """Test Admin can batch schedule guards across a 7-day week."""
    admin_headers = get_token_headers(seeded_data["admin"].id)
    site1_id = seeded_data["site1"].id
    guard1_id = seeded_data["guard_profile1"].id
    guard2_id = seeded_data["guard_profile2"].id

    payload = {
        "site_id": site1_id,
        "start_date": "2026-08-17",
        "end_date": "2026-08-23",
        "assignments": [
            {"guard_id": guard1_id, "date": "2026-08-17", "shift_type": "DAY", "notes": "Main Gate"},
            {"guard_id": guard2_id, "date": "2026-08-17", "shift_type": "NIGHT", "notes": "Patrol"},
            {"guard_id": guard1_id, "date": "2026-08-18", "shift_type": "DAY", "notes": "Main Gate"},
            {"guard_id": guard2_id, "date": "2026-08-18", "shift_type": "NIGHT", "notes": "Patrol"},
            {"guard_id": guard1_id, "date": "2026-08-19", "shift_type": "DAY", "notes": "Main Gate"},
            {"guard_id": guard2_id, "date": "2026-08-19", "shift_type": "NIGHT", "notes": "Patrol"},
            {"guard_id": guard1_id, "date": "2026-08-20", "shift_type": "DAY", "notes": "Main Gate"},
        ],
    }

    response = client.post("/api/v1/rosters/weekly", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["site_id"] == site1_id
    assert data["total_scheduled"] == 7
    assert len(data["rosters"]) == 7


def test_weekly_roster_conflict_detection(client: TestClient, seeded_data):
    """Test scheduling the same guard on the same date/shift at another site triggers 400 Bad Request."""
    admin_headers = get_token_headers(seeded_data["admin"].id)
    site1_id = seeded_data["site1"].id
    site2_id = seeded_data["site2"].id
    guard1_id = seeded_data["guard_profile1"].id

    # 1. Schedule guard1 at site1 on 2026-08-25 DAY
    client.post(
        "/api/v1/rosters/",
        json={"site_id": site1_id, "guard_id": guard1_id, "date": "2026-08-25", "shift_type": "DAY"},
        headers=admin_headers,
    )

    # 2. Try to weekly assign guard1 at site2 on same date and shift -> 400 Conflict
    payload = {
        "site_id": site2_id,
        "start_date": "2026-08-25",
        "end_date": "2026-08-31",
        "assignments": [
            {"guard_id": guard1_id, "date": "2026-08-25", "shift_type": "DAY", "notes": "Conflicting Shift"},
        ],
    }
    response = client.post("/api/v1/rosters/weekly", json=payload, headers=admin_headers)
    assert response.status_code == 400
    assert "already scheduled" in response.json()["detail"]


def test_staff_can_only_view_own_shift_rosters(client: TestClient, seeded_data):
    """Test Staff guard accounts can only view their own shift assignments."""
    staff1_headers = get_token_headers(seeded_data["guard_user1"].id)

    response = client.get("/api/v1/rosters/", headers=staff1_headers)
    assert response.status_code == 200
    rosters = response.json()
    # Guard 1 only sees rosters assigned to guard_profile1
    assert len(rosters) >= 1
    for r in rosters:
        assert r["guard_id"] == seeded_data["guard_profile1"].id


def test_client_can_only_view_own_site_rosters(client: TestClient, seeded_data):
    """Test Client accounts only view rosters for their owned sites."""
    client1_headers = get_token_headers(seeded_data["client_user1"].id)

    response = client.get("/api/v1/rosters/", headers=client1_headers)
    assert response.status_code == 200
    rosters = response.json()
    assert len(rosters) >= 1
    for r in rosters:
        assert r["site_id"] == seeded_data["site1"].id
