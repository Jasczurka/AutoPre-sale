from sqlalchemy import Column, String, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.config.database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, in_progress, completed, error
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    backlog_items = relationship("BacklogItem", back_populates="analysis", cascade="all, delete-orphan")
    tkp_items = relationship("TKPItem", back_populates="analysis", cascade="all, delete-orphan")


class BacklogItem(Base):
    __tablename__ = "backlog_table"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analysis_results.id"), nullable=False)
    work_number = Column(Text, nullable=False)
    work_type = Column(Text, nullable=False)
    acceptance_criteria = Column(Text, nullable=True)
    
    # Relationship
    analysis = relationship("AnalysisResult", back_populates="backlog_items")


class TKPItem(Base):
    __tablename__ = "tkp_table"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analysis_results.id"), nullable=False)
    url = Column(Text, nullable=False)  # URL файла в MinIO
    
    # Relationship
    analysis = relationship("AnalysisResult", back_populates="tkp_items")


