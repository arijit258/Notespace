from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.activity_log import ActivityLog, ActionType
from app.models.user import User
from app.models.note import Note

def log_activity(
    db: Session,
    user_id: int,
    action: ActionType,
    note_id: int | None = None,
    details: str | None = None
) -> ActivityLog:
    """Log an activity."""
    log = ActivityLog(
        user_id=user_id,
        note_id=note_id,
        action=action,
        details=details
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_note_activity(db: Session, note_id: int, limit: int = 50) -> list[dict]:
    """Get activity logs for a specific note."""
    stmt = (
        select(ActivityLog, User.email)
        .join(User, ActivityLog.user_id == User.id)
        .where(ActivityLog.note_id == note_id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(limit)
    )
    results = db.execute(stmt).all()
    
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": email,
            "note_id": log.note_id,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp
        }
        for log, email in results
    ]

def get_user_activity(db: Session, user_id: int, limit: int = 50) -> list[dict]:
    """Get activity logs for a specific user."""
    stmt = (
        select(ActivityLog, Note.title)
        .outerjoin(Note, ActivityLog.note_id == Note.id)
        .where(ActivityLog.user_id == user_id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(limit)
    )
    results = db.execute(stmt).all()
    
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "note_id": log.note_id,
            "note_title": title,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp
        }
        for log, title in results
    ]
