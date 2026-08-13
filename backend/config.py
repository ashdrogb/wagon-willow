import os
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = True

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-me")

    _default_db_path = os.path.join(BASE_DIR, "instance", "wagon_willow.db")
    _env_db_url = os.environ.get("DATABASE_URL", "sqlite:///instance/wagon_willow.db")
    if _env_db_url.startswith("sqlite:///") and not _env_db_url.startswith("sqlite:////"):
        _rel_path = _env_db_url.replace("sqlite:///", "", 1)
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, _rel_path)}"
    else:
        SQLALCHEMY_DATABASE_URI = _env_db_url

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

    # Session cookie settings for cross-port dev (Vite on 5173, Flask on 5000)
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False  # set True once served over HTTPS in production
