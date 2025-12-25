from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Integer, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.config.database import Base


class TemplateBlock(Base):
    """Семантический блок презентации (например, 'Описание проекта', 'Техническое решение')"""
    __tablename__ = "template_blocks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Код блока (уникальный идентификатор)
    code = Column(String(100), nullable=False, unique=True, index=True)
    
    # Человекочитаемое название блока
    name = Column(String(255), nullable=False)
    
    # Описание назначения блока
    description = Column(Text, nullable=True)
    
    # Категория блока (overview, technical, roadmap и т.п.)
    category = Column(String(100), nullable=True, index=True)
    
    # URL PPTX файла блока в MinIO
    pptx_file_url = Column(Text, nullable=False)
    
    # URL PNG превью блока в MinIO
    preview_png_url = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    fields = relationship("BlockField", back_populates="block", cascade="all, delete-orphan", order_by="BlockField.order_index")


class BlockField(Base):
    """Поле (плейсхолдер) внутри блока презентации"""
    __tablename__ = "block_fields"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Ссылка на блок
    block_id = Column(UUID(as_uuid=True), ForeignKey("template_blocks.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Логический ключ поля (например, project_description, project_goals)
    field_key = Column(String(100), nullable=False)
    
    # Строка плейсхолдера в PPTX (например, {{ text.project_description }})
    placeholder = Column(String(255), nullable=False)
    
    # Тип поля (title, text, list, image, table и т.п.)
    type = Column(String(50), nullable=False)
    
    # Обязательность поля
    required = Column(Boolean, default=False, nullable=False)
    
    # Порядок отображения поля
    order_index = Column(Integer, nullable=False, default=0)
    
    # Метаданные поля (шрифты, выравнивание, ограничения и т.п.)
    field_metadata = Column(JSONB, nullable=True, default=dict)
    
    # Relationship
    block = relationship("TemplateBlock", back_populates="fields")
