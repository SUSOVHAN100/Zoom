import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Determine database path:
# - On Render with disk: DATABASE_URL env var points to /data/zoom_clone.db
# - On Render without disk: use /opt/render/project/src/ (writable, but resets on redeploy)
# - Local dev: use ./zoom_clone.db relative to backend/

def _get_database_url() -> str:
    # Explicit env var wins (set this on Render)
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url

    # On Render, the working dir is /opt/render/project/src
    # but we prefer /data if the disk is mounted
    if os.path.isdir("/data"):
        return "sqlite:////data/zoom_clone.db"

    # Fallback: local development
    return "sqlite:///./zoom_clone.db"


SQLALCHEMY_DATABASE_URL = _get_database_url()

# Ensure parent directory exists (important for /data path on Render)
if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///"):
    raw_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "", 1)
    if raw_path.startswith("/"):
        Path(raw_path).parent.mkdir(parents=True, exist_ok=True)

# SQLAlchemy engine
# connect_args={"check_same_thread": False} is required only for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal class for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base class for SQLAlchemy models (SQLAlchemy 2.0 style DeclarativeBase)
class Base(DeclarativeBase):
    pass


# Database dependency for FastAPI routes
def get_db():
    """
    Dependency generator function that yields a database session.
    Ensures that the session is closed after the request is processed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
