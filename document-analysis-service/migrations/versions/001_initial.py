"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2025-12-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create analysis_results table
    op.create_table(
        'analysis_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_analysis_results_project_id', 'analysis_results', ['project_id'])
    
    # Create backlog_table
    op.create_table(
        'backlog_table',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('analysis_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('work_number', sa.Text(), nullable=False),
        sa.Column('work_type', sa.Text(), nullable=False),
        sa.Column('acceptance_criteria', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['analysis_id'], ['analysis_results.id'], ondelete='CASCADE'),
    )
    
    # Create tkp_table
    op.create_table(
        'tkp_table',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('analysis_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(['analysis_id'], ['analysis_results.id'], ondelete='CASCADE'),
    )


def downgrade() -> None:
    op.drop_table('tkp_table')
    op.drop_table('backlog_table')
    op.drop_index('ix_analysis_results_project_id', table_name='analysis_results')
    op.drop_table('analysis_results')


