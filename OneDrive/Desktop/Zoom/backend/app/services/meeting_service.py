from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.meeting import Meeting
from app.models.meeting_link import MeetingLink
from app.models.participant import Participant
from app.services.meeting_id_service import (
    generate_unique_meeting_id,
    generate_unique_invite_token,
    generate_invite_url
)

def _get_default_user(db: Session) -> User:
    """Helper function to fetch the seeded default user."""
    default_email = "user@example.com"
    user = db.query(User).filter(User.email == default_email).first()
    if not user:
        raise ValueError("Default user not found. Please run the database seed operation first.")
    return user

def create_instant_meeting(db: Session, title: Optional[str] = None, description: Optional[str] = None) -> Meeting:
    """
    Creates an instant meeting.
    Uses the seeded default user as host, generates a unique meeting ID,
    creates an invite link, stores everything, and returns the meeting.
    """
    user = _get_default_user(db)
    meeting_id = generate_unique_meeting_id(db)
    
    # Create the instant meeting (active immediately: status="live")
    meeting = Meeting(
        meeting_id=meeting_id,
        title=title or "Instant Meeting",
        description=description,
        host_id=user.id,
        scheduled_at=datetime.utcnow(),
        duration=120,  # Default duration for instant meetings
        status="live"
    )
    db.add(meeting)
    db.flush()  # Populates meeting.id to bind to link
    
    # Generate meeting link
    invite_token = generate_unique_invite_token(db)
    invite_url = generate_invite_url(meeting_id)
    
    meeting_link = MeetingLink(
        meeting_id=meeting.id,
        invite_token=invite_token,
        invite_url=invite_url
    )
    db.add(meeting_link)
    db.commit()
    db.refresh(meeting)
    return meeting

def schedule_meeting(db: Session, title: str, description: Optional[str], scheduled_at: datetime, duration: int) -> Meeting:
    """
    Creates a scheduled meeting.
    Uses the seeded default user as host, generates a unique meeting ID,
    creates an invite link, stores everything, and returns the meeting.
    """
    user = _get_default_user(db)
    
    # Ensure scheduled_at is offset-naive if stored as UTC in SQLite, or handle accordingly.
    # In SQLite/SQLAlchemy, naive datetimes representing UTC are typical.
    if scheduled_at.tzinfo is not None:
        scheduled_at = scheduled_at.astimezone(timezone.utc).replace(tzinfo=None)
        
    meeting_id = generate_unique_meeting_id(db)
    
    meeting = Meeting(
        meeting_id=meeting_id,
        title=title,
        description=description,
        host_id=user.id,
        scheduled_at=scheduled_at,
        duration=duration,
        status="scheduled"
    )
    db.add(meeting)
    db.flush()
    
    # Generate meeting link
    invite_token = generate_unique_invite_token(db)
    invite_url = generate_invite_url(meeting_id)
    
    meeting_link = MeetingLink(
        meeting_id=meeting.id,
        invite_token=invite_token,
        invite_url=invite_url
    )
    db.add(meeting_link)
    db.commit()
    db.refresh(meeting)
    return meeting

def get_meeting_by_id(db: Session, meeting_id: str) -> Optional[Meeting]:
    """Fetches a meeting by its unique meeting_id identifier."""
    return db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()

def join_meeting(db: Session, meeting_id_or_token: str, display_name: str) -> Tuple[Meeting, Participant]:
    """
    Registers a participant to a meeting using either the meeting_id or invite_token.
    Validates existence of the meeting and correctness of the display name.
    """
    clean_name = display_name.strip()
    if not clean_name:
        raise ValueError("Display name cannot be empty or consist only of whitespace.")
    
    # Attempt 1: Fetch by meeting_id (xxx-xxxx-xxx)
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id_or_token).first()
    
    # Attempt 2: Fetch by invite token
    if not meeting:
        link = db.query(MeetingLink).filter(MeetingLink.invite_token == meeting_id_or_token).first()
        if link:
            meeting = link.meeting
            
    if not meeting:
        raise KeyError("Meeting not found. Verify the meeting ID or invite token.")
        
    # Create participant record
    participant = Participant(
        meeting_id=meeting.id,
        display_name=clean_name,
        is_host=(clean_name == "Default User")
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    db.refresh(meeting)
    return meeting, participant

def get_upcoming_meetings(db: Session) -> List[Meeting]:
    """Retrieves future scheduled meetings for the default user."""
    user = _get_default_user(db)
    current_time = datetime.utcnow()
    return (
        db.query(Meeting)
        .filter(Meeting.host_id == user.id, Meeting.scheduled_at >= current_time)
        .order_by(Meeting.scheduled_at.asc())
        .all()
    )

def get_recent_meetings(db: Session) -> List[Meeting]:
    """Retrieves past meetings (instant or past scheduled) for the default user."""
    user = _get_default_user(db)
    current_time = datetime.utcnow()
    return (
        db.query(Meeting)
        .filter(Meeting.host_id == user.id, Meeting.scheduled_at < current_time)
        .order_by(Meeting.scheduled_at.desc())
        .all()
    )
