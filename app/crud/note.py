from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from fastapi import HTTPException

from app.models.note import Note
from app.models.note_version import NoteVersion
from app.models.collaborator import NoteCollaborator
from app.crud.collaborator import get_note_with_access, require_edit_access

def _require_owner(note: Note, user_id: int):
    if note.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")

def create_note(db: Session, owner_id: int, title: str, content: str) -> Note:
    note = Note(owner_id=owner_id, title=title, content=content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

def list_notes(db: Session, owner_id: int, q: str | None = None) -> list[Note]:
    stmt = select(Note).where(Note.owner_id == owner_id).order_by(Note.updated_at.desc())
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Note.title.ilike(like)) | (Note.content.ilike(like)))
    return list(db.scalars(stmt).all())

def list_shared_notes(db: Session, user_id: int) -> list[dict]:
    """List notes shared with the user."""
    stmt = (
        select(Note, NoteCollaborator.role)
        .join(NoteCollaborator, Note.id == NoteCollaborator.note_id)
        .where(NoteCollaborator.user_id == user_id)
        .order_by(Note.updated_at.desc())
    )
    results = db.execute(stmt).all()
    return [{"note": note, "role": role} for note, role in results]

def search_notes(db: Session, user_id: int, q: str) -> list[Note]:
    """Search notes by title or content (owned + shared)."""
    like = f"%{q}%"
    
    # Get IDs of notes shared with user
    shared_note_ids = select(NoteCollaborator.note_id).where(NoteCollaborator.user_id == user_id)
    
    stmt = (
        select(Note)
        .where(
            or_(Note.owner_id == user_id, Note.id.in_(shared_note_ids)),
            or_(Note.title.ilike(like), Note.content.ilike(like))
        )
        .order_by(Note.updated_at.desc())
    )
    return list(db.scalars(stmt).all())

def get_note(db: Session, note_id: int) -> Note:
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

def update_note(db: Session, note_id: int, user_id: int, title: str | None, content: str | None) -> Note:
    note = get_note(db, note_id)
    # Access check is done in the route via require_edit_access

    # determine next version number
    max_version = db.scalar(select(func.max(NoteVersion.version_number)).where(NoteVersion.note_id == note_id))
    next_version = (max_version or 0) + 1

    # store snapshot BEFORE applying changes (snapshot = old state)
    version = NoteVersion(
        note_id=note_id,
        version_number=next_version,
        title_snapshot=note.title,
        content_snapshot=note.content,
        editor_user_id=user_id,
    )
    db.add(version)

    # apply updates
    if title is not None:
        note.title = title
    if content is not None:
        note.content = content

    db.commit()
    db.refresh(note)
    return note

def delete_note(db: Session, note_id: int, user_id: int) -> None:
    note = get_note(db, note_id)
    _require_owner(note, user_id)
    db.delete(note)
    db.commit()

def list_versions(db: Session, note_id: int, user_id: int) -> list[NoteVersion]:
    # Access check is done in the route
    stmt = select(NoteVersion).where(NoteVersion.note_id == note_id).order_by(NoteVersion.version_number.desc())
    return list(db.scalars(stmt).all())

def get_version(db: Session, note_id: int, version_number: int, user_id: int) -> NoteVersion:
    # Access check is done in the route
    stmt = select(NoteVersion).where(
        NoteVersion.note_id == note_id,
        NoteVersion.version_number == version_number
    )
    v = db.scalar(stmt)
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")
    return v

def restore_version(db: Session, note_id: int, version_number: int, user_id: int) -> Note:
    note = get_note(db, note_id)
    # Access check is done in the route

    v = get_version(db, note_id, version_number, user_id)

    # create a version snapshot before restore (so restore action is also reversible)
    max_version = db.scalar(select(func.max(NoteVersion.version_number)).where(NoteVersion.note_id == note_id))
    next_version = (max_version or 0) + 1
    db.add(NoteVersion(
        note_id=note_id,
        version_number=next_version,
        title_snapshot=note.title,
        content_snapshot=note.content,
        editor_user_id=user_id,
    ))

    # restore
    note.title = v.title_snapshot
    note.content = v.content_snapshot

    db.commit()
    db.refresh(note)
    return note
