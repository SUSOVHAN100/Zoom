from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.meeting import (
    MeetingCreateRequest,
    MeetingScheduleRequest,
    MeetingJoinRequest,
    ParticipantCreateRequest,
    MeetingResponse,
    ParticipantResponse,
    JoinResponse
)
from app.services import meeting_service, participant_service

router = APIRouter(
    tags=["Meetings"]
)

@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_instant_meeting(
    payload: Optional[MeetingCreateRequest] = None, 
    db: Session = Depends(get_db)
):
    """
    Creates an instant (live) meeting using the seeded default user as the host.
    Generates a unique meeting ID, invite token, and invite URL.
    """
    title = payload.title if payload else None
    description = payload.description if payload else None
    try:
        return meeting_service.create_instant_meeting(db, title=title, description=description)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/schedule", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def schedule_meeting(
    payload: MeetingScheduleRequest, 
    db: Session = Depends(get_db)
):
    """
    Schedules a future meeting hosted by the default user.
    Generates a unique meeting ID, invite token, and invite URL.
    """
    try:
        return meeting_service.schedule_meeting(
            db, 
            title=payload.title, 
            description=payload.description, 
            scheduled_at=payload.scheduled_at, 
            duration=payload.duration
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/join", response_model=JoinResponse)
def join_meeting(
    payload: MeetingJoinRequest, 
    db: Session = Depends(get_db)
):
    """
    Joins a meeting using a unique meeting_id or invite token.
    Registers a new participant to the database.
    """
    try:
        meeting, participant = meeting_service.join_meeting(
            db, 
            meeting_id_or_token=payload.meeting_id_or_token, 
            display_name=payload.display_name
        )
        return {"meeting": meeting, "participant": participant}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/upcoming", response_model=List[MeetingResponse])
def get_upcoming_meetings(db: Session = Depends(get_db)):
    """
    Retrieves all scheduled/upcoming meetings for the default user.
    """
    try:
        return meeting_service.get_upcoming_meetings(db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/recent", response_model=List[MeetingResponse])
def get_recent_meetings(db: Session = Depends(get_db)):
    """
    Retrieves all past or instant meetings for the default user.
    """
    try:
        return meeting_service.get_recent_meetings(db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting_by_id(meeting_id: str, db: Session = Depends(get_db)):
    """
    Retrieves a meeting's details using its unique meeting ID.
    Returns 404 if the meeting does not exist.
    """
    meeting = meeting_service.get_meeting_by_id(db, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Meeting with ID '{meeting_id}' not found"
        )
    return meeting

@router.get("/{meeting_id}/participants", response_model=List[ParticipantResponse])
def get_active_participants(meeting_id: str, db: Session = Depends(get_db)):
    """
    Returns all active (non-left) participants for a meeting.
    Returns 404 if the meeting does not exist.
    """
    try:
        return participant_service.get_active_participants(db, meeting_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/{meeting_id}/participants", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED)
def add_participant(meeting_id: str, payload: ParticipantCreateRequest, db: Session = Depends(get_db)):
    """
    Adds a guest participant to a meeting.
    Returns 404 if the meeting does not exist, and 400 for invalid inputs.
    """
    try:
        return participant_service.add_participant(db, meeting_id, payload.display_name)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
