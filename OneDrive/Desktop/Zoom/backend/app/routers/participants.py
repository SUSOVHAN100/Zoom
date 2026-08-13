from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.meeting import ParticipantResponse
from app.services import participant_service

router = APIRouter(
    tags=["Participants"]
)

@router.delete("/{participant_id}", response_model=ParticipantResponse)
def remove_participant(participant_id: int, db: Session = Depends(get_db)):
    """
    Marks a participant as left from the meeting (setting left_at timestamp)
    to preserve historical data.
    Returns 404 if the participant is not found.
    """
    try:
        return participant_service.remove_participant(db, participant_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
