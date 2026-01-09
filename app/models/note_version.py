from sqlalchemy import Integer, Text, DateTime, ForeignKey, func, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class NoteVersion(Base):
    __tablename__ = "note_versions"
    __table_args__ = (
        UniqueConstraint("note_id", "version_number", name="uq_note_version"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    note_id: Mapped[int] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"), index=True)

    version_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # snapshot (requirement says content snapshot; we store title+content snapshot for better restore)
    title_snapshot: Mapped[str] = mapped_column(String(200), nullable=False)
    content_snapshot: Mapped[str] = mapped_column(Text, nullable=False)

    editor_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), server_default=func.now())

    note = relationship("Note", back_populates="versions")
