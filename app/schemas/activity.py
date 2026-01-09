from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class ActionType(str, Enum):
    CREATE = "create"
    VIEW = "view"
    UPDATE = "update"
    DELETE = "delete"
    SHARE = "share"
    UNSHARE = "unshare"
    RESTORE = "restore"

class ActivityLogOut(BaseModel):
    id: int
    user_id: int
    user_email: str | None = None
    note_id: int | None
    note_title: str | None = None
    action: ActionType
    details: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}
