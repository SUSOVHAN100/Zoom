from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base

class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    left_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_host: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    # Many participants belong to a meeting
    meeting: Mapped["Meeting"] = relationship(back_populates="participants")
