"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2025-12-23 12:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create template_files table
    op.create_table(
        'template_files',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('version', sa.String(50), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.Column('archived', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('url_file', sa.Text(), nullable=False),
    )
    
    # Create template_blocks table
    op.create_table(
        'template_blocks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('origin_file_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('slide_number', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('key', sa.String(100), nullable=False),
        sa.Column('value_schema', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('position', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('size', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('block_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('url_file', sa.Text(), nullable=False),
        sa.Column('url_png', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['origin_file_id'], ['template_files.id'], ondelete='CASCADE'),
    )
    
    # Create indexes
    op.create_index('ix_template_blocks_origin_file_id', 'template_blocks', ['origin_file_id'])
    op.create_index('ix_template_blocks_type', 'template_blocks', ['type'])
    op.create_index('ix_template_files_archived', 'template_files', ['archived'])


def downgrade() -> None:
    op.drop_index('ix_template_files_archived', table_name='template_files')
    op.drop_index('ix_template_blocks_type', table_name='template_blocks')
    op.drop_index('ix_template_blocks_origin_file_id', table_name='template_blocks')
    op.drop_table('template_blocks')
    op.drop_table('template_files')
