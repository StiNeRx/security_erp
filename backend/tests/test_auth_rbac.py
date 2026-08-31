from fastapi.testclient import TestClient
from tests.conftest import get_token_headers


def test_login_success_json(client: TestClient, seeded_data):
    """Test successful JSON login endpoint."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "AdminPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@test.com"
    assert data["user"]["role"] == "ADMIN"


def test_login_success_oauth2_form(client: TestClient, seeded_data):
    """Test standard OAuth2 form login for Swagger docs."""
    response = client.post(
        "/api/v1/auth/login/access-token",
        data={"username": "client1@test.com", "password": "ClientPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "CLIENT"


def test_login_invalid_credentials(client: TestClient, seeded_data):
    """Test login failure with wrong password."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "WrongPassword123"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password."


def test_auth_me_endpoint(client: TestClient, seeded_data):
    """Test /auth/me returns the current user profile."""
    headers = get_token_headers(seeded_data["guard_user1"].id)
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "guard1@test.com"
    assert data["role"] == "STAFF"


def test_unauthorized_request(client: TestClient, seeded_data):
    """Test accessing protected endpoint without token returns 401."""
    response = client.get("/api/v1/users/")
    assert response.status_code == 401
