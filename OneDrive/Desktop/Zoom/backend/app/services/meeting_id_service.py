import secrets
import string
import os
from sqlalchemy.orm import Session
from app.models.meeting import Meeting
from app.models.meeting_link import MeetingLink

def generate_unique_meeting_id(db: Session) -> str:
    """
    Generates a unique, public-safe Google Meet style hyphenated ID format: xxx-xxxx-xxx
    Checks the database to avoid collisions.
    """
    alphabet = string.ascii_lowercase
    while True:
        part1 = "".join(secrets.choice(alphabet) for _ in range(3))
        part2 = "".join(secrets.choice(alphabet) for _ in range(4))
        part3 = "".join(secrets.choice(alphabet) for _ in range(3))
        meeting_id = f"{part1}-{part2}-{part3}"
        
        # Check database for collision
        exists = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
        if not exists:
            return meeting_id

def generate_unique_invite_token(db: Session) -> str:
    """
    Generates a unique, secure URL-safe random token.
    Checks the database to avoid collisions.
    """
    while True:
        token = secrets.token_urlsafe(16)
        
        # Check database for collision
        exists = db.query(MeetingLink).filter(MeetingLink.invite_token == token).first()
        if not exists:
            return token

def generate_invite_url(meeting_id: str) -> str:
    """
    Generates an invite URL using the frontend base URL.
    Reads FRONTEND_URL from environment variables (defaults to http://localhost:3000).
    """
    frontend_base = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{frontend_base}/meeting/{meeting_id}"
