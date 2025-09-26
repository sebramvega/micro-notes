from flask import Flask, jsonify
from models import init_db
from auth import bp as auth_bp, init_auth


def create_app():
    app = Flask(__name__)
    app.json.sort_keys = False

    init_db(app)
    init_auth(app)

    @app.get("/healthz")
    def healthz():
        return jsonify({"ok": True})

    app.register_blueprint(auth_bp)
    return app
