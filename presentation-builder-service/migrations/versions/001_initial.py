"""Initial migration - create presentations tables

Revision ID: 001
Revises: 
Create Date: 2025-12-25 11:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create presentations table
    op.create_table(
        'presentations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='Draft'),
        sa.Column('file_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()'))
    )
    op.create_index('idx_presentations_project_id', 'presentations', ['project_id'])
    op.create_index('idx_presentations_status', 'presentations', ['status'])
    
    # Create presentation_slides table
    op.create_table(
        'presentation_slides',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('presentation_id', UUID(as_uuid=True), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['presentation_id'], ['presentations.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('presentation_id', 'order_index', name='uq_presentation_slide_order')
    )
    op.create_index('idx_slides_presentation_id', 'presentation_slides', ['presentation_id'])
    
    # Create slide_blocks table
    op.create_table(
        'slide_blocks',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('slide_id', UUID(as_uuid=True), nullable=False),
        sa.Column('template_block_id', UUID(as_uuid=True), nullable=False),
        sa.Column('position_index', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['slide_id'], ['presentation_slides.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('slide_id', 'position_index', name='uq_slide_block_position')
    )
    op.create_index('idx_blocks_slide_id', 'slide_blocks', ['slide_id'])
    op.create_index('idx_blocks_template_id', 'slide_blocks', ['template_block_id'])
    
    # Create slide_block_values table
    op.create_table(
        'slide_block_values',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('slide_block_id', UUID(as_uuid=True), nullable=False),
        sa.Column('field_key', sa.String(255), nullable=False),
        sa.Column('value', JSONB, nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['slide_block_id'], ['slide_blocks.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('slide_block_id', 'field_key', name='uq_block_value_field')
    )
    op.create_index('idx_values_slide_block_id', 'slide_block_values', ['slide_block_id'])
    op.create_index('idx_values_field_key', 'slide_block_values', ['field_key'])
    
    # Create trigger function for updated_at
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)
    
    # Create triggers
    op.execute("""
        CREATE TRIGGER update_presentations_updated_at 
        BEFORE UPDATE ON presentations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    
    op.execute("""
        CREATE TRIGGER update_slide_block_values_updated_at 
        BEFORE UPDATE ON slide_block_values
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    op.drop_table('slide_block_values')
    op.drop_table('slide_blocks')
    op.drop_table('presentation_slides')
    op.drop_table('presentations')
    op.execute('DROP FUNCTION IF EXISTS update_updated_at_column()')
