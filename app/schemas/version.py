from pydantic import BaseModel
from datetime import datetime

class VersionOut(BaseModel):
    id: int
    note_id: int
    version_number: int
    title_snapshot: str
    content_snapshot: str
    editor_user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
