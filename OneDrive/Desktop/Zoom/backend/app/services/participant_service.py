from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.meeting import Meeting
from app.models.participant import Participant

def get_active_participants(db: Session, meeting_id: str) -> List[Participant]:
    """
    Returns all active (non-left) participants for a meeting.
    Throws a KeyError if the meeting is not found.
    """
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise KeyError(f"Meeting with ID '{meeting_id}' not found.")
        
    return (
        db.query(Participant)
        .filter(Participant.meeting_id == meeting.id, Participant.left_at.is_(None))
        .all()
    )

def add_participant(db: Session, meeting_id: str, display_name: str) -> Participant:
    """
    Adds a guest participant to a meeting.
    Validates display name and meeting existence.
    """
    clean_name = display_name.strip()
    if not clean_name:
        raise ValueError("Display name cannot be empty or consist only of whitespace.")
        
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise KeyError(f"Meeting with ID '{meeting_id}' not found.")
        
    participant = Participant(
        meeting_id=meeting.id,
        display_name=clean_name,
        is_host=False
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant

def remove_participant(db: Session, participant_id: int) -> Participant:
    """
    Marks a participant as left the meeting (sets left_at) without deleting their record,
    thus preserving the historical meeting log.
    Throws a KeyError if the participant is not found.
    """
    participant = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participant:
        raise KeyError(f"Participant with ID '{participant_id}' not found.")
        
    if participant.left_at is None:
        participant.left_at = datetime.utcnow()
        db.commit()
        db.refresh(participant)
        
    return participant
