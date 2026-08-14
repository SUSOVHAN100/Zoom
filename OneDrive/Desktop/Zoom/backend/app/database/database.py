import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

_env_url = os.environ.get("DATABASE_URL", "")

if _env_url:
    # Render provides "postgres://..." but SQLAlchemy requires "postgresql://..."
    SQLALCHEMY_DATABASE_URL = _env_url.replace("postgres://", "postgresql://", 1)
else:
    # Local development fallback: use SQLite (no setup required)
    SQLALCHEMY_DATABASE_URL = "sqlite:///./zoom_clone.db"

# SQLite requires check_same_thread=False; PostgreSQL does not support it
is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

# SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

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
