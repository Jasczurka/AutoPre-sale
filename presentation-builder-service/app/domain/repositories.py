"""Repository interfaces for domain entities"""
from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities import Presentation, PresentationSlide, SlideBlock, SlideBlockValue


class IPresentationRepository(ABC):
    """Interface for presentation repository"""
    
    @abstractmethod
    def create(self, presentation: Presentation) -> Presentation:
        """Create a new presentation"""
        pass
    
    @abstractmethod
    def get_by_id(self, presentation_id: UUID) -> Optional[Presentation]:
        """Get presentation by ID"""
        pass
    
    @abstractmethod
    def get_all(self, skip: int = 0, limit: int = 100) -> List[Presentation]:
        """Get all presentations"""
        pass
    
    @abstractmethod
    def update(self, presentation: Presentation) -> Presentation:
        """Update presentation"""
        pass
    
    @abstractmethod
    def delete(self, presentation_id: UUID) -> bool:
        """Delete presentation"""
        pass


class ISlideRepository(ABC):
    """Interface for slide repository"""
    
    @abstractmethod
    def create(self, slide: PresentationSlide) -> PresentationSlide:
        """Create a new slide"""
        pass
    
    @abstractmethod
    def get_by_id(self, slide_id: UUID) -> Optional[PresentationSlide]:
        """Get slide by ID"""
        pass
    
    @abstractmethod
    def get_by_presentation(self, presentation_id: UUID) -> List[PresentationSlide]:
        """Get all slides for a presentation"""
        pass
    
    @abstractmethod
    def delete(self, slide_id: UUID) -> bool:
        """Delete slide"""
        pass


class IBlockRepository(ABC):
    """Interface for block repository"""
    
    @abstractmethod
    def create(self, block: SlideBlock) -> SlideBlock:
        """Create a new block"""
        pass
    
    @abstractmethod
    def get_by_id(self, block_id: UUID) -> Optional[SlideBlock]:
        """Get block by ID"""
        pass
    
    @abstractmethod
    def get_by_slide(self, slide_id: UUID) -> List[SlideBlock]:
        """Get all blocks for a slide"""
        pass
    
    @abstractmethod
    def update(self, block: SlideBlock) -> SlideBlock:
        """Update block"""
        pass
    
    @abstractmethod
    def delete(self, block_id: UUID) -> bool:
        """Delete block"""
        pass


class IBlockValueRepository(ABC):
    """Interface for block value repository"""
    
    @abstractmethod
    def create(self, value: SlideBlockValue) -> SlideBlockValue:
        """Create a new block value"""
        pass
    
    @abstractmethod
    def get_by_block(self, block_id: UUID) -> List[SlideBlockValue]:
        """Get all values for a block"""
        pass
    
    @abstractmethod
    def upsert(self, block_id: UUID, field_key: str, value: dict) -> SlideBlockValue:
        """Upsert a block value"""
        pass
    
    @abstractmethod
    def delete_by_block(self, block_id: UUID) -> bool:
        """Delete all values for a block"""
        pass
