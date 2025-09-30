"""
Micro Notes — Users Service (Auth Tests)
---------------------------------------

Integration-style test exercising the happy path for **/auth/signup**, **/auth/login**,
and **/auth/me** using Flask’s test client with an in-memory SQLite database.

Key behaviors & notes
- Environment is configured per-test to use `sqlite:///:memory:` and a fixed `JWT_SECRET`
  for deterministic, isolated runs.
- Signup is tolerant of prior state: accepts **201** (created) *or* **409** (already exists).
- Login returns a JWT `access_token`; `/auth/me` must accept that token and return the user.
- Test uses the *app factory* (`create_app`) to avoid global state bleed between tests.

Typical usage
-------------
    pytest -q services/users/tests/test_auth.py
"""

import os, sys
from app import create_app

sys.path.insert(0, os.getcwd())

# why: force predictable, isolated test environment without touching dev/prod configs
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET"] = "devsecret"


def test_signup_login_me():
    """
    End-to-end flow:
      1) Sign up a user (idempotent: 201 or 409).
      2) Log in with the same credentials to get a JWT.
      3) Call /auth/me with Bearer token and assert identity fields.
    """
    app = create_app()
    app.testing = True  # why: enables testing behaviors (propagate exceptions, etc.)
    client = app.test_client()

    # signup
    r = client.post(
        "/auth/signup", json={"email": "harry@example.com", "password": "harry123"}
    )
    # why: test is resilient to re-runs (DB may already contain the user)
    assert r.status_code in (201, 409)  # ok if already exists

    # login
    r = client.post(
        "/auth/login", json={"email": "harry@example.com", "password": "harry123"}
    )
    assert r.status_code == 200
    token = r.get_json()["access_token"]
    # why: ensure a non-empty string token; exact format is JWT but we don't couple to encoding here
    assert isinstance(token, str) and token

    # me
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.get_json()
    # why: echo fields confirm the token's subject resolves to the same user
    assert data["email"] == "harry@example.com"
    assert isinstance(data["id"], int)
