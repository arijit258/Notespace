from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.deps import get_db
from app.core.security import decode_token
from app.models.user import User
from app.schemas.user import UserOut
from app.schemas.activity import ActivityLogOut
from app.crud import activity as activity_crud

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    user_id = int(decode_token(token))
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all users (for sharing functionality)."""
    users = db.scalars(select(User)).all()
    return users

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/me/activity", response_model=list[ActivityLogOut])
def my_activity(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get current user's activity logs."""
    logs = activity_crud.get_user_activity(db, current_user.id)
    return [ActivityLogOut(**log) for log in logs]
