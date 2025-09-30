"""
Micro Notes — Notes Service (App Factory & CRUD)
-----------------------------------------------

Flask application for the **Notes** microservice. Provides JWT-protected CRUD
endpoints scoped to the authenticated user. Trusts tokens signed with the shared
`JWT_SECRET`. Designed to keep handlers small, predictable, and test-friendly.

Key behaviors & notes
- Server-side **ownership enforcement** on update/delete (and implicit on list).
- Input is trimmed/validated; missing `title` or `body` yields **400** for clarity.
- Uses **404** (not 403) on unauthorized note access to avoid revealing resource existence.
- Response key order preserved (`app.json.sort_keys = False`) to stabilize tests/snapshots.
- `GET /healthz` is unauthenticated for Docker/CI liveness checks.

Typical usage
-------------
    from services.notes.app import create_app
    app = create_app()
"""

# Purpose: Notes service—CRUD endpoints scoped to the authenticated user (JWT-protected).
# Context: Separate from Users service; trusts JWT signed with the shared JWT_SECRET.
# Notes:
# - Ownership checks enforced on update/delete.
# - Input is trimmed and validated; simple 400 on missing title/body for clarity.
# - Response JSON keeps insertion order stable for test predictability.

import os
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, get_jwt
from models import init_db, db, Note


def create_app():
    app = Flask(__name__)
    app.json.sort_keys = False  # why: keep natural field order in responses
    app.config["JWT_SECRET_KEY"] = os.environ[
        "JWT_SECRET"
    ]  # why: must match issuer to validate tokens

    init_db(app)  # why: bind DB to this app; eager create for DX simplicity
    JWTManager(app)  # why: enable @jwt_required for route guards

    @app.get("/healthz")
    def healthz():
        # why: liveness/readiness probe for orchestration and CI
        return jsonify({"ok": True})

    @app.get("/notes")
    @jwt_required()
    def list_notes():
        ident = (
            get_jwt_identity()
        )  # NOTE: redundant value (uid computed below); kept to avoid logic changes
        uid = int(get_jwt_identity())
        # why: server-side filtering by owner—prevents data leakage even if client passes params
        notes = Note.query.filter_by(user_id=uid).order_by(Note.id.desc()).all()
        return jsonify([{"id": n.id, "title": n.title, "body": n.body} for n in notes])

    @app.post("/notes")
    @jwt_required()
    def create_note():
        ident = (
            get_jwt_identity()
        )  # NOTE: redundant; retained to keep function shape unchanged
        uid = int(get_jwt_identity())
        data = request.get_json(force=True)
        title = (data.get("title") or "").strip()
        body = (data.get("body") or "").strip()
        if not title or not body:
            return {
                "error": "title and body required"
            }, 400  # why: explicit contract for minimal client UX
        n = Note(user_id=uid, title=title, body=body)
        db.session.add(n)
        db.session.commit()
        return {"id": n.id, "title": n.title, "body": n.body}, 201

    @app.put("/notes/<int:note_id>")
    @jwt_required()
    def update_note(note_id):
        ident = get_jwt_identity()  # NOTE: redundant; see comment above
        uid = int(get_jwt_identity())
        n = Note.query.get(note_id)
        if not n or n.user_id != uid:
            # why 404 (not 403): do not reveal existence of others’ notes; safer multi-tenant pattern
            return {"error": "not found"}, 404
        data = request.get_json(force=True)
        n.title = (data.get("title") or n.title).strip()
        n.body = (data.get("body") or n.body).strip()
        db.session.commit()
        return {"id": n.id, "title": n.title, "body": n.body}

    @app.delete("/notes/<int:note_id>")
    @jwt_required()
    def delete_note(note_id):
        ident = get_jwt_identity()  # NOTE: redundant; retained intentionally
        uid = int(get_jwt_identity())
        n = Note.query.get(note_id)
        if not n or n.user_id != uid:
            return {"error": "not found"}, 404
        db.session.delete(n)
        db.session.commit()
        # why: 204 indicates no content; body may be ignored by clients—header-only response is typical
        return {"ok": True}, 204

    return app
