"""Data Transfer Objects for API"""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


# Request DTOs
class CreatePresentationRequest(BaseModel):
    """Request to create a new presentation"""
    project_id: UUID = Field(..., alias="projectId")
    name: str
    
    class Config:
        populate_by_name = True  # Allow both project_id and projectId


class AddSlideRequest(BaseModel):
    """Request to add a slide (optional, can be empty body)"""
    clone_from_index: Optional[int] = Field(default=0, description="Index of slide to clone (0=first slide, None=use blank layout)", alias="cloneFromIndex")
    layout_index: Optional[int] = Field(default=6, description="Slide layout index (6=blank, used only when clone_from_index is None)", alias="layoutIndex")
    
    class Config:
        populate_by_name = True  # Allow both snake_case and camelCase


class AddBlockRequest(BaseModel):
    """Request to add a block to a slide"""
    template_block_id: Optional[UUID] = Field(default=None, alias="templateBlockId")
    add_blocks: Optional[List[Dict[str, Any]]] = Field(default=None, alias="addBlocks")
    
    class Config:
        populate_by_name = True
    
    def get_block_id(self) -> UUID:
        """Extract block ID from various input formats"""
        # If addBlocks array is provided, use first item
        if self.add_blocks and len(self.add_blocks) > 0:
            first_block = self.add_blocks[0]
            if isinstance(first_block, dict):
                block_id = first_block.get('templateBlockId') or first_block.get('template_block_id')
                if block_id:
                    return UUID(block_id) if isinstance(block_id, str) else block_id
        # Otherwise use template_block_id directly
        if self.template_block_id:
            return self.template_block_id
        raise ValueError("No template_block_id provided")


class UpdateBlockValuesRequest(BaseModel):
    """Request to update block field values"""
    values: Dict[str, Any] = Field(description="Dictionary of field_key: value pairs")


# Response DTOs - Define in correct order (dependencies first)
class BlockValueResponse(BaseModel):
    """Block value response"""
    id: UUID
    slide_block_id: UUID = Field(serialization_alias='slideBlockId')
    field_key: str = Field(serialization_alias='fieldKey')
    value: Dict[str, Any]
    updated_at: datetime = Field(serialization_alias='updatedAt')
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class BlockResponse(BaseModel):
    """Block response"""
    id: UUID
    slide_id: UUID = Field(serialization_alias='slideId')
    template_block_id: UUID = Field(serialization_alias='templateBlockId')
    position_index: int = Field(serialization_alias='positionIndex')
    created_at: datetime = Field(serialization_alias='createdAt')
    values: List[BlockValueResponse] = []
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class SlideResponse(BaseModel):
    """Slide response"""
    id: UUID
    presentation_id: UUID = Field(serialization_alias='presentationId')
    order_index: int = Field(serialization_alias='orderIndex')
    created_at: datetime = Field(serialization_alias='createdAt')
    blocks: List[BlockResponse] = []  # Include blocks for frontend
    slide_number: Optional[int] = Field(default=None, serialization_alias='slideNumber')  # Computed field
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_encoders={
            UUID: str,
            datetime: lambda v: v.isoformat()
        }
    )
    
    def model_dump(self, **kwargs):
        """Override model_dump to add slideNumber and use camelCase"""
        # Set by_alias=True by default if not specified
        if 'by_alias' not in kwargs:
            kwargs['by_alias'] = True
        data = super().model_dump(**kwargs)
        # Add computed slideNumber field if not already set
        if 'slideNumber' not in data or data['slideNumber'] is None:
            data['slideNumber'] = self.order_index + 1
        return data


class PresentationResponse(BaseModel):
    """Presentation response"""
    id: UUID
    project_id: UUID = Field(serialization_alias='projectId')
    name: str
    status: str
    file_url: Optional[str] = Field(default=None, serialization_alias='fileUrl')
    created_at: datetime = Field(serialization_alias='createdAt')
    updated_at: datetime = Field(serialization_alias='updatedAt')
    slides: List[SlideResponse] = []  # Include slides for frontend
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class GenerateResponse(BaseModel):
    """Response after generating presentation"""
    presentation_id: UUID
    status: str
    file_url: str
    message: str


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    timestamp: datetime
