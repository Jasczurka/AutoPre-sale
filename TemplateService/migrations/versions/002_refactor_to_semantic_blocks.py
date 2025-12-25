"""Refactor to semantic blocks model

Revision ID: 002
Revises: 001
Create Date: 2025-12-23 16:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old tables and indexes
    op.drop_index('ix_template_files_archived', table_name='template_files')
    op.drop_index('ix_template_blocks_type', table_name='template_blocks')
    op.drop_index('ix_template_blocks_origin_file_id', table_name='template_blocks')
    op.drop_table('template_blocks')
    op.drop_table('template_files')
    
    # Create new template_blocks table (semantic blocks)
    op.create_table(
        'template_blocks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('code', sa.String(100), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('pptx_file_url', sa.Text(), nullable=False),
        sa.Column('preview_png_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    
    # Create block_fields table
    op.create_table(
        'block_fields',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('block_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('field_key', sa.String(100), nullable=False),
        sa.Column('placeholder', sa.String(255), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('field_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['block_id'], ['template_blocks.id'], ondelete='CASCADE'),
    )
    
    # Create indexes
    op.create_index('ix_template_blocks_code', 'template_blocks', ['code'], unique=True)
    op.create_index('ix_template_blocks_category', 'template_blocks', ['category'])
    op.create_index('ix_block_fields_block_id', 'block_fields', ['block_id'])


def downgrade() -> None:
    # Drop new tables and indexes
    op.drop_index('ix_block_fields_block_id', table_name='block_fields')
    op.drop_index('ix_template_blocks_category', table_name='template_blocks')
    op.drop_index('ix_template_blocks_code', table_name='template_blocks')
    op.drop_table('block_fields')
    op.drop_table('template_blocks')
    
    # Restore old tables
    op.create_table(
        'template_files',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('version', sa.String(50), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.Column('archived', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('url_file', sa.Text(), nullable=False),
    )
    
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
    
    op.create_index('ix_template_blocks_origin_file_id', 'template_blocks', ['origin_file_id'])
    op.create_index('ix_template_blocks_type', 'template_blocks', ['type'])
    op.create_index('ix_template_files_archived', 'template_files', ['archived'])
