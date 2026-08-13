from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# Request Schemas
class MeetingCreateRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=150, description="Title of the meeting")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the meeting")

class MeetingScheduleRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=150, description="Title of the meeting")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the meeting")
    scheduled_at: datetime = Field(..., description="Scheduled date and time in UTC")
    duration: int = Field(..., gt=0, description="Duration of the meeting in minutes")

class MeetingJoinRequest(BaseModel):
    meeting_id_or_token: str = Field(..., min_length=1, description="Meeting ID (xxx-xxxx-xxx) or invite token")
    display_name: str = Field(..., min_length=1, max_length=100, description="Display name of the participant")

class ParticipantCreateRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100, description="Display name of the participant")

# Response Schemas
class MeetingLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    invite_token: str
    invite_url: str
    created_at: datetime

class ParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    display_name: str
    joined_at: datetime
    left_at: Optional[datetime] = None
    is_host: bool

class MeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: str
    title: str
    description: Optional[str] = None
    host_id: int
    scheduled_at: datetime
    duration: int
    status: str
    created_at: datetime
    meeting_link: Optional[MeetingLinkResponse] = None

class JoinResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    meeting: MeetingResponse
    participant: ParticipantResponse
