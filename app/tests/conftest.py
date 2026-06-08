import tempfile
from pathlib import Path

import pytest

from app import create_app


@pytest.fixture()
def client():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.db"
        app = create_app(
            {
                "TESTING": True,
                "DATABASE_PATH": str(db_path),
                "SECRET_KEY": "test-secret",
                "JWT_EXPIRATION_HOURS": 24,
            }
        )
        with app.test_client() as client:
            yield client


def register_and_login(client, email="customer@example.com", password="StrongPass123!"):
    client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "role": "customer"},
    )
    login = client.post("/api/auth/login", json={"email": email, "password": password})
    token = login.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def auth_headers(client):
    return register_and_login(client)


@pytest.fixture()
def admin_headers(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "admin@demo.local", "password": "Admin123!"},
    )
    token = login.get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}
