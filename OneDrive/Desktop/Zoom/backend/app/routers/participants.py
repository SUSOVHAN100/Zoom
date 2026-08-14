from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.meeting import ParticipantResponse
from app.services import participant_service
from app.dependencies import get_current_user
from app.models.user import User
from app.models.participant import Participant
from typing import Optional

router = APIRouter(
    tags=["Participants"]
)

@router.delete("/{participant_id}", response_model=ParticipantResponse)
def remove_participant(
    participant_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Marks a participant as left from the meeting (setting left_at timestamp)
    to preserve historical data.
    Only the meeting host can perform this action.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to perform this action"
        )
        
    participant = db.query(Participant).filter(Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Participant with ID '{participant_id}' not found"
        )
        
    meeting = participant.meeting
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting associated with this participant not found"
        )
        
    if meeting.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the meeting host is authorized to remove participants"
        )

    try:
        return participant_service.remove_participant(db, participant_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/{participant_id}/rejoin", response_model=ParticipantResponse)
def rejoin_participant(participant_id: int, db: Session = Depends(get_db)):
    """
    Rejoins/reactivates a participant (sets left_at back to None).
    """
    try:
        return participant_service.rejoin_participant(db, participant_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
