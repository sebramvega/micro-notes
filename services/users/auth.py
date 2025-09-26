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
    app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET"]
    bcrypt.init_app(app)
    jwt.init_app(app)


@bp.post("/signup")
def signup():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already in use"}), 409
    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    u = User(email=email, password_hash=pw_hash)
    db.session.add(u)
    db.session.commit()
    return jsonify({"id": u.id, "email": u.email}), 201


@bp.post("/login")
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    u = User.query.filter_by(email=email).first()
    if not u or not bcrypt.check_password_hash(u.password_hash, password):
        return jsonify({"error": "invalid credentials"}), 401
    token = create_access_token(
        identity=str(u.id), additional_claims={"email": u.email}
    )
    return jsonify({"access_token": token})


@bp.get("/me")
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    claims = get_jwt() or {}
    return jsonify({"id": uid, "email": claims.get("email")})
