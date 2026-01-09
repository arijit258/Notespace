from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum

class CollaboratorRole(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"

class ShareNoteIn(BaseModel):
    email: EmailStr
    role: CollaboratorRole = CollaboratorRole.VIEWER

class CollaboratorOut(BaseModel):
    id: int
    user_id: int
    email: str
    role: CollaboratorRole
    created_at: datetime

    model_config = {"from_attributes": True}
