from typing import Optional
from fastapi import Header, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User

def get_current_user(x_user_id: Optional[str] = Header(None, alias="X-User-Id"), db: Session = Depends(get_db)) -> Optional[User]:
    """
    Mock authentication dependency.
    Reads 'X-User-Id' header and fetches the corresponding User from SQLite/PostgreSQL.
    Returns None if the header is missing or the user does not exist.
    """
    if not x_user_id:
        return None
    try:
        user_id = int(x_user_id)
        return db.query(User).filter(User.id == user_id).first()
    except ValueError:
        return None
