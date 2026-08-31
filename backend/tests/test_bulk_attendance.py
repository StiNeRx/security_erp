from fastapi.testclient import TestClient
from tests.conftest import get_token_headers


def test_bulk_attendance_marking_success(client: TestClient, seeded_data):
    """Test bulk marking attendance for multiple scheduled guards on a specific date."""
    admin_headers = get_token_headers(seeded_data["admin"].id)
    site1_id = seeded_data["site1"].id
    guard1_id = seeded_data["guard_profile1"].id
    guard2_id = seeded_data["guard_profile2"].id

    # 1. Schedule two guards at site1 on 2026-08-28
    res1 = client.post(
        "/api/v1/rosters/",
        json={"site_id": site1_id, "guard_id": guard1_id, "date": "2026-08-28", "shift_type": "DAY"},
        headers=admin_headers,
    )
    res2 = client.post(
        "/api/v1/rosters/",
        json={"site_id": site1_id, "guard_id": guard2_id, "date": "2026-08-28", "shift_type": "NIGHT"},
        headers=admin_headers,
    )
    roster1_id = res1.json()["id"]
    roster2_id = res2.json()["id"]

    # 2. Mark bulk attendance
    payload = {
        "site_id": site1_id,
        "date": "2026-08-28",
        "attendances": [
            {
                "roster_id": roster1_id,
                "status": "PRESENT",
                "check_in_time": "2026-08-28T08:00:00Z",
                "check_out_time": "2026-08-28T18:00:00Z",
                "overtime_hours": "2.00",
                "remarks": "On time, performed VIP escort",
            },
            {
                "roster_id": roster2_id,
                "status": "HALF_DAY",
                "check_in_time": "2026-08-28T20:00:00Z",
                "check_out_time": "2026-08-29T00:00:00Z",
                "overtime_hours": "0.00",
                "remarks": "Left early due to illness",
            },
        ],
    }

    response = client.post("/api/v1/attendances/bulk", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["site_id"] == site1_id
    assert data["total_marked"] == 2
    assert len(data["attendances"]) == 2


def test_bulk_attendance_mismatched_site_error(client: TestClient, seeded_data):
    """Test marking attendance for a roster belonging to a different site fails with 400."""
    admin_headers = get_token_headers(seeded_data["admin"].id)
    site1_id = seeded_data["site1"].id
    roster2_id = seeded_data["roster2"].id  # Roster2 belongs to Site2

    payload = {
        "site_id": site1_id,
        "date": "2026-08-10",
        "attendances": [
            {
                "roster_id": roster2_id,
                "status": "PRESENT",
            }
        ],
    }
    response = client.post("/api/v1/attendances/bulk", json=payload, headers=admin_headers)
    assert response.status_code == 400
    assert "does not belong to Site" in response.json()["detail"]


def test_client_cannot_mark_attendance(client: TestClient, seeded_data):
    """Test Client account receives 403 Forbidden when attempting to mark attendance."""
    client1_headers = get_token_headers(seeded_data["client_user1"].id)
    site1_id = seeded_data["site1"].id
    roster1_id = seeded_data["roster1"].id

    payload = {
        "site_id": site1_id,
        "date": "2026-08-10",
        "attendances": [{"roster_id": roster1_id, "status": "PRESENT"}],
    }
    response = client.post("/api/v1/attendances/bulk", json=payload, headers=client1_headers)
    assert response.status_code == 403
