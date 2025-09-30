"""
Micro Notes — Notes Service (Models & DB Setup)
-----------------------------------------------

Defines the SQLAlchemy binding and the `Note` ORM model for the Notes
microservice. Provides `init_db(app)` to configure the DB connection and to
create tables for local/dev/CI runs.

Key behaviors & notes
- DB URI read from Flask config first, then `DATABASE_URL` env (Docker/12-factor).
- `SQLALCHEMY_TRACK_MODIFICATIONS=False` to avoid event overhead.
- Uses `db.create_all()` as a lightweight bootstrap for tests/CI.
  For production, prefer migrations (e.g., Alembic).
- `Note.user_id` is indexed to speed owner-scoped queries (e.g., list user’s notes).
- Titles capped at 200 chars; bodies are unbounded text.

Typical usage
-------------
    from services.notes.models import init_db, db, Note
    init_db(app)
    # db.session.add(Note(...)); db.session.commit()
"""

import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db(app):
    # why: allow explicit Flask config override; fall back to env for containerized runs
    uri = app.config.get("SQLALCHEMY_DATABASE_URI") or os.environ["DATABASE_URL"]
    app.config["SQLALCHEMY_DATABASE_URI"] = uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False  # why: reduce overhead/noise
    db.init_app(app)
    with app.app_context():
        # why: simple schema bootstrap for local/dev/CI; use Alembic in production
        db.create_all()


class Note(db.Model):
    __tablename__ = "notes"
    id = db.Column(db.Integer, primary_key=True)
    # why: owner scoping; indexed to accelerate queries like "all notes for user X"
    user_id = db.Column(db.Integer, nullable=False, index=True)
    # why: keep titles concise for UI listings/search (200 chars is ample)
    title = db.Column(db.String(200), nullable=False)
    # why: free-form note content; Text avoids length constraints
    body = db.Column(db.Text, nullable=False)
