"""
Micro Notes — Users Service (Models & DB Setup)
-----------------------------------------------

Defines the SQLAlchemy database binding and the `User` ORM model for the Users
microservice. Provides `init_db(app)` to configure the DB connection and create
tables for simple local/dev/CI scenarios.

Key behaviors & notes
- Reads DB URI from Flask config first, then falls back to `DATABASE_URL` env
  (Docker/12-factor friendly).
- Disables SQLAlchemy's event system noise (`SQLALCHEMY_TRACK_MODIFICATIONS=False`)
  for lower overhead.
- Calls `db.create_all()` at startup as a zero-migrations bootstrap for dev/CI.
  **Production** should use migrations (e.g., Alembic) to evolve schemas safely.
- `User.email` is unique + indexed to support fast lookups and enforce uniqueness.

Typical usage
-------------
    from services.users.models import init_db, db, User
    init_db(app)
    # db.session.add(User(...)); db.session.commit()
"""

# Purpose: Database setup and the User model for the Users service.
# Context: SQLAlchemy is initialized here; create_all is used for simple local/dev setups.
# Notes: For production, prefer migrations (e.g., Alembic) over create_all to manage schema changes.

import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db(app):
    # why: allow explicit Flask config override; else fall back to env (Docker-friendly)
    uri = app.config.get("SQLALCHEMY_DATABASE_URI") or os.environ["DATABASE_URL"]
    app.config["SQLALCHEMY_DATABASE_URI"] = uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = (
        False  # why: disable noisy & costly signals
    )
    db.init_app(app)
    with app.app_context():
        # why: simple bootstrap for local/dev/CI; migrations recommended in real deployments
        db.create_all()


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    # why: unique + indexed email for fast login lookups and uniqueness at DB level
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    # why: store a bcrypt hash only (never plaintext); 255 fits bcrypt strings comfortably
    password_hash = db.Column(db.String(255), nullable=False)
