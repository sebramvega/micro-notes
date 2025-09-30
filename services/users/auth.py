"""
Micro Notes — Users Service (Auth Blueprint)
-------------------------------------------

Authentication endpoints for the Users microservice: **signup**, **login**, and **/me**.
Uses BCrypt for password hashing and issues short JWT access tokens that identify
the user by primary key (stringified). Designed for small, testable handlers with
clear status codes for client UX and CI assertions.

Key behaviors & notes
- JWT identity = `user.id` (string) keeps tokens small and avoids putting PII in `sub`.
- Returns **401** for invalid credentials and **409** for email conflicts (signup).
- Minimal responses: never return `password_hash`. Add non-sensitive claims (e.g., email)
  for convenience, but keep payloads lean.
- `GET /auth/me` is JWT-protected and reads identity from the token, not from input.
- The same `JWT_SECRET` must be configured for any service that needs to validate tokens
  (e.g., Notes) or they should accept tokens as opaque and call back to Users.

Typical usage
-------------
Mount in the app factory and initialize with env-provided secret:

    from services.users.auth import bp as auth_bp, init_auth
    init_auth(app)
    app.register_blueprint(auth_bp)
"""

# Purpose: Authentication blueprint—signup, login, and identity endpoint (/me).
# Context: Issues JWTs on login; expects the same JWT secret to be shared with the Notes service.
# Notes:
# - JWT identity = user.id (stringified) keeps tokens small and avoids PII.
# - 401 on invalid credentials; 409 on email conflicts—clear semantics for clients/CI tests.

import os
from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

from models import db, User

bp = Blueprint("auth", __name__, url_prefix="/auth")
bcrypt = Bcrypt()
jwt = JWTManager()


def init_auth(app):
    """
    Bind JWT + BCrypt to the current Flask app.

    why:
    - Secrets/config must come from env/instance config (never hardcode).
    - Extensions need the concrete app instance to attach context/state.
    """
    # why: secret must come from env/config; do not hardcode secrets in source
    app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET"]
    # (Optional) You could set expirations/algorithms here if needed:
    # app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

    bcrypt.init_app(app)
    jwt.init_app(app)


@bp.post("/signup")
def signup():
    """
    Create a new user account.

    Request JSON: { "email": str, "password": str }
    Responses:
      201 -> { "id": int, "email": str }
      400 -> { "error": "email and password required" }
      409 -> { "error": "email already in use" }
    """
    # why: force=True to handle clients that omit proper headers during early dev
    data = request.get_json(force=True)
    email = (
        (data.get("email") or "").strip().lower()
    )  # why: canonicalize for uniqueness
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    if User.query.filter_by(email=email).first():
        # why: explicit conflict status helps frontends display "email already used"
        return jsonify({"error": "email already in use"}), 409

    # why: bcrypt hashing; decode to str for DB storage
    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    u = User(email=email, password_hash=pw_hash)
    db.session.add(u)
    db.session.commit()
    # why: do not return password_hash; keep payload minimal
    return jsonify({"id": u.id, "email": u.email}), 201


@bp.post("/login")
def login():
    """
    Issue a JWT for valid credentials.

    Request JSON: { "email": str, "password": str }
    Responses:
      200 -> { "access_token": str, "user": { "id": int, "email": str } }
      401 -> { "error": "invalid credentials" }
    """
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    # why: single indexed lookup; timing differences kept minimal
    u = User.query.filter_by(email=email).first()
    if not u or not bcrypt.check_password_hash(u.password_hash, password):
        # why: generic 401 avoids disclosing which field failed (less user enumeration)
        return jsonify({"error": "invalid credentials"}), 401

    # why: identity kept to user id; email added as a non-sensitive, convenient claim
    additional_claims = {"email": u.email}
    token = create_access_token(identity=str(u.id), additional_claims=additional_claims)

    # why: include basic user echo so clients can stash minimal user state post-login
    return jsonify({"access_token": token, "user": {"id": u.id, "email": u.email}}), 200


@bp.get("/me")
@jwt_required()
def me():
    """
    Return the authenticated user's minimal profile.

    why:
    - Identity comes from the JWT `sub` (user id) to avoid trusting client input.
    - We re-read from DB to reflect any email changes post-token-issue.
    Responses:
      200 -> { "id": int, "email": str }
      404 -> { "error": "user not found" }  (edge case: stale token after deletion)
    """
    user_id = get_jwt_identity()  # stringified id set at token creation
    # why: ensure we return up-to-date info even if token claims include email
    u = User.query.get(int(user_id)) if user_id is not None else None
    if not u:
        return jsonify({"error": "user not found"}), 404

    # Optional: surface non-sensitive claims if ever needed for debugging
    _claims = get_jwt()  # contains "email" from additional_claims
    return jsonify({"id": u.id, "email": u.email}), 200
