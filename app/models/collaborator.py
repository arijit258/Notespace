from sqlalchemy import ForeignKey, DateTime, func, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import enum

class CollaboratorRole(str, enum.Enum):
    VIEWER = "viewer"
    EDITOR = "editor"

class NoteCollaborator(Base):
    __tablename__ = "note_collaborators"

    id: Mapped[int] = mapped_column(primary_key=True)
    note_id: Mapped[int] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(SQLEnum(CollaboratorRole), default=CollaboratorRole.VIEWER)
    created_at: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), server_default=func.now())

    note = relationship("Note", back_populates="collaborators")
    user = relationship("User", back_populates="shared_notes")
