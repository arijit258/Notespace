"""init

Revision ID: 5ef6e0e52c70
Revises: 
Create Date: 2026-01-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5ef6e0e52c70"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- notes ---
    op.create_table(
        "notes",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_notes_owner_id", "notes", ["owner_id"], unique=False)

    # --- note_versions ---
    op.create_table(
        "note_versions",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("note_id", sa.Integer(), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("title_snapshot", sa.String(length=200), nullable=False),
        sa.Column("content_snapshot", sa.Text(), nullable=False),
        sa.Column("editor_user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["note_id"], ["notes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["editor_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("note_id", "version_number", name="uq_note_version"),
    )
    op.create_index("ix_note_versions_note_id", "note_versions", ["note_id"], unique=False)
    op.create_index("ix_note_versions_editor_user_id", "note_versions", ["editor_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_note_versions_editor_user_id", table_name="note_versions")
    op.drop_index("ix_note_versions_note_id", table_name="note_versions")
    op.drop_table("note_versions")

    op.drop_index("ix_notes_owner_id", table_name="notes")
    op.drop_table("notes")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
