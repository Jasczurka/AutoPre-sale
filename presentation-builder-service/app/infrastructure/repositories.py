"""Repository implementations"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from app.domain.entities import Presentation, PresentationSlide, SlideBlock, SlideBlockValue
from app.domain.repositories import (
    IPresentationRepository, 
    ISlideRepository, 
    IBlockRepository,
    IBlockValueRepository
)


class PresentationRepository(IPresentationRepository):
    """PostgreSQL implementation of presentation repository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, presentation: Presentation) -> Presentation:
        self.db.add(presentation)
        self.db.commit()
        self.db.refresh(presentation)
        return presentation
    
    def get_by_id(self, presentation_id: UUID) -> Optional[Presentation]:
        return self.db.query(Presentation).options(
            joinedload(Presentation.slides).joinedload(PresentationSlide.blocks).joinedload(SlideBlock.values)
        ).filter(
            Presentation.id == presentation_id
        ).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[Presentation]:
        return self.db.query(Presentation).offset(skip).limit(limit).all()
    
    def update(self, presentation: Presentation) -> Presentation:
        presentation.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(presentation)
        return presentation
    
    def delete(self, presentation_id: UUID) -> bool:
        presentation = self.get_by_id(presentation_id)
        if presentation:
            self.db.delete(presentation)
            self.db.commit()
            return True
        return False


class SlideRepository(ISlideRepository):
    """PostgreSQL implementation of slide repository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, slide: PresentationSlide) -> PresentationSlide:
        self.db.add(slide)
        self.db.commit()
        self.db.refresh(slide)
        return slide
    
    def get_by_id(self, slide_id: UUID) -> Optional[PresentationSlide]:
        return self.db.query(PresentationSlide).options(
            joinedload(PresentationSlide.blocks).joinedload(SlideBlock.values)
        ).filter(
            PresentationSlide.id == slide_id
        ).first()
    
    def get_by_presentation(self, presentation_id: UUID) -> List[PresentationSlide]:
        return self.db.query(PresentationSlide).options(
            joinedload(PresentationSlide.blocks).joinedload(SlideBlock.values)
        ).filter(
            PresentationSlide.presentation_id == presentation_id
        ).order_by(PresentationSlide.order_index).all()
    
    def delete(self, slide_id: UUID) -> bool:
        slide = self.get_by_id(slide_id)
        if slide:
            self.db.delete(slide)
            self.db.commit()
            return True
        return False


class BlockRepository(IBlockRepository):
    """PostgreSQL implementation of block repository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, block: SlideBlock) -> SlideBlock:
        self.db.add(block)
        self.db.commit()
        self.db.refresh(block)
        return block
    
    def get_by_id(self, block_id: UUID) -> Optional[SlideBlock]:
        return self.db.query(SlideBlock).options(
            joinedload(SlideBlock.values)
        ).filter(SlideBlock.id == block_id).first()
    
    def get_by_slide(self, slide_id: UUID) -> List[SlideBlock]:
        return self.db.query(SlideBlock).filter(
            SlideBlock.slide_id == slide_id
        ).order_by(SlideBlock.position_index).all()
    
    def update(self, block: SlideBlock) -> SlideBlock:
        self.db.commit()
        self.db.refresh(block)
        return block
    
    def delete(self, block_id: UUID) -> bool:
        block = self.get_by_id(block_id)
        if block:
            self.db.delete(block)
            self.db.commit()
            return True
        return False


class BlockValueRepository(IBlockValueRepository):
    """PostgreSQL implementation of block value repository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, value: SlideBlockValue) -> SlideBlockValue:
        self.db.add(value)
        self.db.commit()
        self.db.refresh(value)
        return value
    
    def get_by_block(self, block_id: UUID) -> List[SlideBlockValue]:
        return self.db.query(SlideBlockValue).filter(
            SlideBlockValue.slide_block_id == block_id
        ).all()
    
    def upsert(self, block_id: UUID, field_key: str, value: dict) -> SlideBlockValue:
        # Try to find existing value
        existing = self.db.query(SlideBlockValue).filter(
            SlideBlockValue.slide_block_id == block_id,
            SlideBlockValue.field_key == field_key
        ).first()
        
        if existing:
            existing.value = value
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            new_value = SlideBlockValue(
                slide_block_id=block_id,
                field_key=field_key,
                value=value
            )
            return self.create(new_value)
    
    def delete_by_block(self, block_id: UUID) -> bool:
        deleted = self.db.query(SlideBlockValue).filter(
            SlideBlockValue.slide_block_id == block_id
        ).delete()
        self.db.commit()
        return deleted > 0
