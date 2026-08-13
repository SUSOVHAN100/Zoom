import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Use the working directory for SQLite - always writable on Render and locally.
# Render's working directory is /opt/render/project/src/
# Override with DATABASE_URL env var only if it's NOT pointing to /data (which requires a paid disk).
_env_url = os.environ.get("DATABASE_URL", "")
if _env_url and "/data" not in _env_url:
    SQLALCHEMY_DATABASE_URL = _env_url
else:
    # Default: relative path, works locally and on Render free tier
    SQLALCHEMY_DATABASE_URL = "sqlite:///./zoom_clone.db"

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
