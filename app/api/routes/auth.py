from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.auth import RegisterIn, TokenOut
from app.crud.user import create_user, authenticate
from app.core.security import create_access_token

router = APIRouter()

@router.post("/register", response_model=dict)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    user = create_user(db, payload.email, payload.password)
    return {"message": "User created", "user_id": user.id}

@router.post("/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate(db, form.username, form.password)
    token = create_access_token(subject=str(user.id))
    return TokenOut(access_token=token)
