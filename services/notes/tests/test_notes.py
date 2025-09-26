import os, sys
sys.path.insert(0, os.getcwd())

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET"] = "devsecret"

from app import create_app
from flask_jwt_extended import create_access_token

def auth_header(app, user_id="42"):
    with app.app_context():
        token = create_access_token(identity=str(user_id))
    return {"Authorization": f"Bearer {token}"}

def test_crud_notes():
    app = create_app()
    app.testing = True
    client = app.test_client()
    headers = auth_header(app)

    # list empty
    r = client.get("/notes", headers=headers)
    assert r.status_code == 200
    assert r.get_json() == []

    # create
    r = client.post("/notes", json={"title": "first", "body": "hello"}, headers=headers)
    assert r.status_code == 201
    note = r.get_json()
    nid = note["id"]
    assert note["title"] == "first"

    # update
    r = client.put(f"/notes/{nid}", json={"title": "updated"}, headers=headers)
    assert r.status_code == 200
    assert r.get_json()["title"] == "updated"

    # list has 1
    r = client.get("/notes", headers=headers)
    assert r.status_code == 200
    arr = r.get_json()
    assert len(arr) == 1 and arr[0]["id"] == nid

    # delete
    r = client.delete(f"/notes/{nid}", headers=headers)
    assert r.status_code == 204

    # list empty again
    r = client.get("/notes", headers=headers)
    assert r.status_code == 200
    assert r.get_json() == []
