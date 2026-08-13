import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


def _get_database_url() -> str:
    # Explicit env var wins (set this on Render)
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url

    # On Render with disk mounted at /data
    if os.path.isdir("/data"):
        return "sqlite:////data/zoom_clone.db"

    # Fallback: local development (relative path)
    return "sqlite:///./zoom_clone.db"


SQLALCHEMY_DATABASE_URL = _get_database_url()

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
