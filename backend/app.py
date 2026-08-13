import logging

from flask import Flask

from config import Config
from extensions import db, cors, login_manager
from routes import api_bp

logging.basicConfig(level=logging.INFO)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    cors.init_app(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

    login_manager.init_app(app)
    login_manager.session_protection = "strong"

    from models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        from flask import jsonify
        return jsonify({"error": "login required"}), 401

    app.register_blueprint(api_bp)

    with app.app_context():
        db.create_all()

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"status": "ok"}

    return app


app = create_app()

if __name__ == "__main__":
    import os
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode, port=5000)
