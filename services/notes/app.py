import os
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, get_jwt
from models import init_db, db, Note


def create_app():
    app = Flask(__name__)
    app.json.sort_keys = False
    app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET"]

    init_db(app)
    JWTManager(app)

    @app.get("/healthz")
    def healthz():
        return jsonify({"ok": True})

    @app.get("/notes")
    @jwt_required()
    def list_notes():
        ident = get_jwt_identity()
        uid = int(get_jwt_identity())
        notes = Note.query.filter_by(user_id=uid).order_by(Note.id.desc()).all()
        return jsonify([{"id": n.id, "title": n.title, "body": n.body} for n in notes])

    @app.post("/notes")
    @jwt_required()
    def create_note():
        ident = get_jwt_identity()
        uid = int(get_jwt_identity())
        data = request.get_json(force=True)
        title = (data.get("title") or "").strip()
        body = (data.get("body") or "").strip()
        if not title or not body:
            return {"error": "title and body required"}, 400
        n = Note(user_id=uid, title=title, body=body)
        db.session.add(n)
        db.session.commit()
        return {"id": n.id, "title": n.title, "body": n.body}, 201

    @app.put("/notes/<int:note_id>")
    @jwt_required()
    def update_note(note_id):
        ident = get_jwt_identity()
        uid = int(get_jwt_identity())
        n = Note.query.get(note_id)
        if not n or n.user_id != uid:
            return {"error": "not found"}, 404
        data = request.get_json(force=True)
        n.title = (data.get("title") or n.title).strip()
        n.body = (data.get("body") or n.body).strip()
        db.session.commit()
        return {"id": n.id, "title": n.title, "body": n.body}

    @app.delete("/notes/<int:note_id>")
    @jwt_required()
    def delete_note(note_id):
        ident = get_jwt_identity()
        uid = int(get_jwt_identity())
        n = Note.query.get(note_id)
        if not n or n.user_id != uid:
            return {"error": "not found"}, 404
        db.session.delete(n)
        db.session.commit()
        return {"ok": True}, 204

    return app
