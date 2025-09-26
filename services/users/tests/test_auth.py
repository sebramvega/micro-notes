import os, sys

sys.path.insert(0, os.getcwd())

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET"] = "devsecret"

from app import create_app


def test_signup_login_me():
    app = create_app()
    app.testing = True
    client = app.test_client()

    # signup
    r = client.post(
        "/auth/signup", json={"email": "harry@example.com", "password": "harry123"}
    )
    assert r.status_code in (201, 409)  # ok if already exists

    # login
    r = client.post(
        "/auth/login", json={"email": "harry@example.com", "password": "harry123"}
    )
    assert r.status_code == 200
    token = r.get_json()["access_token"]
    assert isinstance(token, str) and token

    # me
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.get_json()
    assert data["email"] == "harry@example.com"
    assert isinstance(data["id"], int)
