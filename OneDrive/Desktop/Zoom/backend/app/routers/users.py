from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.database.database import get_db
from app.models.user import User
from app.websocket.presence_manager import presence_manager

router = APIRouter(
    tags=["Users"]
)

class UserStatsResponse(BaseModel):
    total_users: int
    online_users: int
    in_meeting_users: int

@router.get("/stats", response_model=UserStatsResponse)
def get_user_stats(db: Session = Depends(get_db)):
    """
    Returns real-time user statistics:
    - total_users: count of User records in database
    - online_users: count of unique users connected to app/presence/meeting sockets
    - in_meeting_users: count of unique users connected to meeting sockets
    """
    total_users = db.query(func.count(User.id)).scalar() or 0
    online_users = presence_manager.get_online_users_count()
    in_meeting_users = presence_manager.get_in_meeting_users_count()

    return UserStatsResponse(
        total_users=total_users,
        online_users=online_users,
        in_meeting_users=in_meeting_users
    )
