"""Domain entities and database models"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.config.database import Base


class Presentation(Base):
    """Presentation entity"""
    __tablename__ = "presentations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="Draft")
    file_url = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    slides = relationship("PresentationSlide", back_populates="presentation", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_presentations_project_id', 'project_id'),
        Index('idx_presentations_status', 'status'),
    )


class PresentationSlide(Base):
    """Presentation slide entity"""
    __tablename__ = "presentation_slides"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    presentation_id = Column(UUID(as_uuid=True), ForeignKey("presentations.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    presentation = relationship("Presentation", back_populates="slides")
    blocks = relationship("SlideBlock", back_populates="slide", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('presentation_id', 'order_index', name='uq_presentation_slide_order'),
        Index('idx_slides_presentation_id', 'presentation_id'),
    )


class SlideBlock(Base):
    """Slide block entity - represents a semantic block added to a slide"""
    __tablename__ = "slide_blocks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slide_id = Column(UUID(as_uuid=True), ForeignKey("presentation_slides.id", ondelete="CASCADE"), nullable=False)
    template_block_id = Column(UUID(as_uuid=True), nullable=False)
    position_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    slide = relationship("PresentationSlide", back_populates="blocks")
    values = relationship("SlideBlockValue", back_populates="block", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('slide_id', 'position_index', name='uq_slide_block_position'),
        Index('idx_blocks_slide_id', 'slide_id'),
        Index('idx_blocks_template_id', 'template_block_id'),
    )


class SlideBlockValue(Base):
    """Block value entity - stores placeholder values for blocks"""
    __tablename__ = "slide_block_values"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slide_block_id = Column(UUID(as_uuid=True), ForeignKey("slide_blocks.id", ondelete="CASCADE"), nullable=False)
    field_key = Column(String(255), nullable=False)
    value = Column(JSONB, nullable=False)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    block = relationship("SlideBlock", back_populates="values")
    
    __table_args__ = (
        UniqueConstraint('slide_block_id', 'field_key', name='uq_block_value_field'),
        Index('idx_values_slide_block_id', 'slide_block_id'),
        Index('idx_values_field_key', 'field_key'),
    )
