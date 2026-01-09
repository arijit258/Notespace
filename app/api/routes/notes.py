from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.api.routes.users import get_current_user
from app.models.user import User
from app.models.activity_log import ActionType
from app.schemas.note import NoteCreate, NoteUpdate, NoteOut, NoteWithRoleOut
from app.schemas.version import VersionOut
from app.schemas.collaborator import ShareNoteIn, CollaboratorOut
from app.schemas.activity import ActivityLogOut
from app.crud import note as note_crud
from app.crud import collaborator as collab_crud
from app.crud import activity as activity_crud

router = APIRouter()

@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note = note_crud.create_note(db, user.id, payload.title, payload.content)
    activity_crud.log_activity(db, user.id, ActionType.CREATE, note.id, f"Created note: {note.title}")
    return note

@router.get("", response_model=list[NoteOut])
def list_notes(
    q: str | None = Query(default=None, description="Search by title/content (optional)"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return note_crud.list_notes(db, user.id, q=q)

@router.get("/shared", response_model=list[NoteWithRoleOut])
def list_shared_notes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """List notes shared with the current user."""
    results = note_crud.list_shared_notes(db, user.id)
    return [
        NoteWithRoleOut(
            id=r["note"].id,
            title=r["note"].title,
            content=r["note"].content,
            owner_id=r["note"].owner_id,
            created_at=r["note"].created_at,
            updated_at=r["note"].updated_at,
            role=r["role"].value
        )
        for r in results
    ]

@router.get("/search", response_model=list[NoteOut])
def search_notes(
    q: str = Query(..., min_length=1, description="Search query"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Search notes by title or content (owned + shared)."""
    return note_crud.search_notes(db, user.id, q)

@router.get("/{note_id}", response_model=NoteOut)
def get_note(note_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note, role = collab_crud.get_note_with_access(db, note_id, user.id)
    activity_crud.log_activity(db, user.id, ActionType.VIEW, note_id)
    return note

@router.put("/{note_id}", response_model=NoteOut)
def update_note(note_id: int, payload: NoteUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Check edit access (owner or editor)
    collab_crud.require_edit_access(db, note_id, user.id)
    note = note_crud.update_note(db, note_id, user.id, payload.title, payload.content)
    activity_crud.log_activity(db, user.id, ActionType.UPDATE, note_id, f"Updated note")
    return note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    note_crud.delete_note(db, note_id, user.id)
    activity_crud.log_activity(db, user.id, ActionType.DELETE, note_id, "Deleted note")
    return None

# ----- Collaborator endpoints -----

@router.post("/{note_id}/share", response_model=CollaboratorOut)
def share_note(note_id: int, payload: ShareNoteIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Share a note with another user."""
    collab = collab_crud.add_collaborator(db, note_id, user.id, payload.email, payload.role.value)
    activity_crud.log_activity(db, user.id, ActionType.SHARE, note_id, f"Shared with {payload.email} as {payload.role.value}")
    # Return with email
    return CollaboratorOut(
        id=collab.id,
        user_id=collab.user_id,
        email=payload.email,
        role=collab.role,
        created_at=collab.created_at
    )

@router.delete("/{note_id}/share/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unshare_note(note_id: int, user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Remove a collaborator from a note."""
    collab_crud.remove_collaborator(db, note_id, user.id, user_id)
    activity_crud.log_activity(db, user.id, ActionType.UNSHARE, note_id, f"Removed collaborator {user_id}")
    return None

@router.get("/{note_id}/collaborators", response_model=list[CollaboratorOut])
def list_collaborators(note_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """List all collaborators of a note."""
    return collab_crud.list_collaborators(db, note_id, user.id)

# ----- Activity log endpoints -----

@router.get("/{note_id}/activity", response_model=list[ActivityLogOut])
def get_note_activity(note_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get activity logs for a specific note."""
    collab_crud.get_note_with_access(db, note_id, user.id)  # Verify access
    logs = activity_crud.get_note_activity(db, note_id)
    return [ActivityLogOut(**log) for log in logs]

# ----- Version endpoints -----

@router.get("/{note_id}/versions", response_model=list[VersionOut])
def list_versions(note_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    collab_crud.get_note_with_access(db, note_id, user.id)  # Verify access
    return note_crud.list_versions(db, note_id, user.id)

@router.get("/{note_id}/versions/{version_number}", response_model=VersionOut)
def get_version(note_id: int, version_number: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    collab_crud.get_note_with_access(db, note_id, user.id)  # Verify access
    return note_crud.get_version(db, note_id, version_number, user.id)

@router.post("/{note_id}/restore/{version_number}", response_model=NoteOut)
def restore(note_id: int, version_number: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    collab_crud.require_edit_access(db, note_id, user.id)  # Require edit access
    note = note_crud.restore_version(db, note_id, version_number, user.id)
    activity_crud.log_activity(db, user.id, ActionType.RESTORE, note_id, f"Restored to version {version_number}")
    return note
