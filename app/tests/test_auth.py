def test_register_and_login_success(client):
    register = client.post(
        "/api/auth/register",
        json={"email": "newuser@example.com", "password": "Password123!", "role": "customer"},
    )
    assert register.status_code == 201
    body = register.get_json()
    assert body["success"] is True

    login = client.post(
        "/api/auth/login",
        json={"email": "newuser@example.com", "password": "Password123!"},
    )
    assert login.status_code == 200
    assert login.get_json()["success"] is True


def test_login_fails_with_invalid_credentials(client):
    client.post(
        "/api/auth/register",
        json={"email": "user2@example.com", "password": "Password123!", "role": "customer"},
    )
    login = client.post(
        "/api/auth/login",
        json={"email": "user2@example.com", "password": "wrong-pass"},
    )
    assert login.status_code == 401
    assert login.get_json()["success"] is False
