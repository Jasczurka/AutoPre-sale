from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Any, Optional, List
from datetime import datetime
from uuid import UUID


# Response DTOs для полей блока
class BlockFieldDto(BaseModel):
    """DTO для поля блока"""
    key: str = Field(..., description="Логический ключ поля")
    type: str = Field(..., description="Тип поля (title, text, list, image, table)")
    required: bool = Field(default=False, description="Обязательность поля")
    placeholder: Optional[str] = Field(None, description="Строка плейсхолдера")
    order_index: Optional[int] = Field(None, description="Порядок отображения")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Дополнительные метаданные")
    
    model_config = ConfigDict(from_attributes=True)


class TemplateBlockListItemDto(BaseModel):
    """Упрощенный DTO для списка блоков - возвращается в GET /api/Templates"""
    id: UUID
    code: str
    name: str
    previewUrl: Optional[str] = Field(None, description="URL превью блока")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class TemplateBlockDto(BaseModel):
    """Полный DTO для блока шаблона - возвращается в GET /api/Templates/{id}"""
    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    pptxFileUrl: str = Field(..., description="URL PPTX файла блока")
    previewUrl: Optional[str] = Field(None, description="URL PNG превью блока")
    fields: List[BlockFieldDto] = Field(default_factory=list, description="Список полей блока")
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# Request DTOs
class UploadTemplateBlockRequestDto(BaseModel):
    """Request для загрузки блока из PPTX файла"""
    code: str = Field(..., description="Уникальный код блока (например: project_overview)")
    name: str = Field(..., description="Человекочитаемое название блока")
    description: Optional[str] = Field(None, description="Описание назначения блока")
    category: Optional[str] = Field(None, description="Категория блока (overview, technical, roadmap и т.п.)")


class CreateTemplateBlockRequestDto(BaseModel):
    """Request для создания блока"""
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    pptx_file_url: str
    preview_png_url: Optional[str] = None


class CreateBlockFieldRequestDto(BaseModel):
    """Request для создания поля блока"""
    field_key: str
    placeholder: str
    type: str
    required: bool = False
    order_index: int = 0
    metadata: Optional[Dict[str, Any]] = None


# Error DTOs
class ErrorResponseDto(BaseModel):
    """Стандартный формат ошибки"""
    error: str
    code: str
    details: Optional[Dict[str, Any]] = None
