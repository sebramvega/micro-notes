"""
Micro Notes — Users Service (App Factory)
-----------------------------------------

Creates and configures the Flask application for the **Users** microservice.
Initializes the database layer first, then wires JWT/auth; finally mounts the
auth blueprint and exposes a lightweight health check for Docker/CI.

Key behaviors & notes
- **Init order matters**: DB before auth (auth can depend on DB-backed lookups).
- Keeps `app.json.sort_keys = False` for predictable key order in responses
  (useful for snapshots/tests and nicer DX).
- `GET /healthz` is intentionally unauthenticated for liveness probes.
- Keep imports here minimal to avoid circulars; blueprints pull their own deps.

Typical usage
-------------
App factory pattern is friendly to tests and WSGI servers:

    from services.users.app import create_app
    app = create_app()
"""

# Purpose: Users service application factory—wires Flask, database, and JWT auth.
# Context: Exposes auth endpoints via the auth blueprint; used by Docker/CI to boot the service.
# Notes: Keep init order: DB before auth (auth may depend on DB-backed lookups in requests).

from flask import Flask, jsonify
from models import init_db
from auth import bp as auth_bp, init_auth


def create_app():
    app = Flask(__name__)
    app.json.sort_keys = (
        False  # why: preserve key order in responses for nicer DX/tests
    )

    # why: DB needs the Flask app context + config loaded before first request
    init_db(app)

    # why: JWT secret/config + extensions must be bound to this app instance
    init_auth(app)

    @app.get("/healthz")
    def healthz():
        # why: fast, unauthenticated liveness probe for Docker/CI
        return jsonify({"ok": True})

    # why: route grouping (prefix /auth) + separation of concerns
    app.register_blueprint(auth_bp)
    return app
