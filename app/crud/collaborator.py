from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.models.note import Note
from app.models.user import User
from app.models.collaborator import NoteCollaborator, CollaboratorRole

def get_note_with_access(db: Session, note_id: int, user_id: int) -> tuple[Note, str]:
    """Get a note if user has access. Returns (note, role) where role is 'owner', 'editor', or 'viewer'."""
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note.owner_id == user_id:
        return note, "owner"
    
    collab = db.scalar(
        select(NoteCollaborator).where(
            NoteCollaborator.note_id == note_id,
            NoteCollaborator.user_id == user_id
        )
    )
    if collab:
        return note, collab.role.value
    
    raise HTTPException(status_code=403, detail="Access denied")

def require_edit_access(db: Session, note_id: int, user_id: int) -> Note:
    """Require at least editor access to a note."""
    note, role = get_note_with_access(db, note_id, user_id)
    if role == "viewer":
        raise HTTPException(status_code=403, detail="Edit access required")
    return note

def require_owner(db: Session, note_id: int, user_id: int) -> Note:
    """Require owner access to a note."""
    note, role = get_note_with_access(db, note_id, user_id)
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can perform this action")
    return note

def add_collaborator(db: Session, note_id: int, owner_id: int, email: str, role: str) -> NoteCollaborator:
    """Add a collaborator to a note."""
    note = require_owner(db, note_id, owner_id)
    
    # Find the user by email
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == owner_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a collaborator")
    
    # Check if already a collaborator
    existing = db.scalar(
        select(NoteCollaborator).where(
            NoteCollaborator.note_id == note_id,
            NoteCollaborator.user_id == user.id
        )
    )
    if existing:
        # Update role
        existing.role = CollaboratorRole(role)
        db.commit()
        db.refresh(existing)
        return existing
    
    collab = NoteCollaborator(
        note_id=note_id,
        user_id=user.id,
        role=CollaboratorRole(role)
    )
    db.add(collab)
    db.commit()
    db.refresh(collab)
    return collab

def remove_collaborator(db: Session, note_id: int, owner_id: int, user_id: int) -> None:
    """Remove a collaborator from a note."""
    require_owner(db, note_id, owner_id)
    
    collab = db.scalar(
        select(NoteCollaborator).where(
            NoteCollaborator.note_id == note_id,
            NoteCollaborator.user_id == user_id
        )
    )
    if not collab:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    
    db.delete(collab)
    db.commit()

def list_collaborators(db: Session, note_id: int, user_id: int) -> list[dict]:
    """List all collaborators of a note."""
    note, _ = get_note_with_access(db, note_id, user_id)
    
    stmt = (
        select(NoteCollaborator, User.email)
        .join(User, NoteCollaborator.user_id == User.id)
        .where(NoteCollaborator.note_id == note_id)
    )
    results = db.execute(stmt).all()
    
    return [
        {
            "id": collab.id,
            "user_id": collab.user_id,
            "email": email,
            "role": collab.role,
            "created_at": collab.created_at
        }
        for collab, email in results
    ]
