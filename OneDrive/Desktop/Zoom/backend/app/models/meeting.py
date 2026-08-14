from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)  # Duration in minutes
    status: Mapped[str] = mapped_column(String(20), default="scheduled", nullable=False)  # "scheduled", "live", "ended"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    host: Mapped["User"] = relationship(back_populates="meetings")
    meeting_link: Mapped[Optional["MeetingLink"]] = relationship(back_populates="meeting", uselist=False)
    participants: Mapped[List["Participant"]] = relationship(back_populates="meeting")

    @property
    def host_participant(self) -> Optional["Participant"]:
        for p in self.participants:
            if p.is_host:
                return p
        return None
