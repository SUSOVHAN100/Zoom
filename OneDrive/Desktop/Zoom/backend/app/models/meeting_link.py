from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base

class MeetingLink(Base):
    __tablename__ = "meeting_links"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), unique=True, nullable=False)
    invite_token: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    invite_url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    # Relationships
    # One-to-one relationship with Meeting
    meeting: Mapped["Meeting"] = relationship(back_populates="meeting_link")
