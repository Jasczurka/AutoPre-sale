from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from app.domain.entities import TemplateBlock, BlockField
from app.domain.repositories import ITemplateBlockRepository, IBlockFieldRepository
import logging

logger = logging.getLogger(__name__)


class TemplateBlockRepository(ITemplateBlockRepository):
    """Репозиторий для работы с семантическими блоками шаблонов"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create(self, block: TemplateBlock) -> TemplateBlock:
        """Создает новый блок"""
        self.db.add(block)
        self.db.commit()
        self.db.refresh(block)
        logger.info(f"Created template block: {block.id} (code: {block.code})")
        return block
    
    async def get_by_id(self, block_id: UUID) -> Optional[TemplateBlock]:
        """Получает блок по ID с его полями"""
        return self.db.query(TemplateBlock)\
            .options(joinedload(TemplateBlock.fields))\
            .filter(TemplateBlock.id == block_id)\
            .first()
    
    async def get_by_code(self, code: str) -> Optional[TemplateBlock]:
        """Получает блок по коду"""
        return self.db.query(TemplateBlock)\
            .options(joinedload(TemplateBlock.fields))\
            .filter(TemplateBlock.code == code)\
            .first()
    
    async def get_all(self, category: Optional[str] = None) -> List[TemplateBlock]:
        """Получает все блоки (с фильтрацией по категории)"""
        query = self.db.query(TemplateBlock)\
            .options(joinedload(TemplateBlock.fields))
        
        if category:
            query = query.filter(TemplateBlock.category == category)
        
        return query.all()
    
    async def update(self, block: TemplateBlock) -> TemplateBlock:
        """Обновляет блок"""
        self.db.commit()
        self.db.refresh(block)
        logger.info(f"Updated template block: {block.id}")
        return block
    
    async def delete(self, block_id: UUID) -> bool:
        """Удаляет блок"""
        block = await self.get_by_id(block_id)
        if not block:
            return False
        
        self.db.delete(block)
        self.db.commit()
        logger.info(f"Deleted template block: {block_id}")
        return True


class BlockFieldRepository(IBlockFieldRepository):
    """Репозиторий для работы с полями блоков"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create(self, field: BlockField) -> BlockField:
        """Создает новое поле блока"""
        self.db.add(field)
        self.db.commit()
        self.db.refresh(field)
        logger.info(f"Created block field: {field.id} (key: {field.field_key})")
        return field
    
    async def create_many(self, fields: List[BlockField]) -> List[BlockField]:
        """Создает несколько полей за раз"""
        self.db.add_all(fields)
        self.db.commit()
        for field in fields:
            self.db.refresh(field)
        logger.info(f"Created {len(fields)} block fields")
        return fields
    
    async def get_by_block_id(self, block_id: UUID) -> List[BlockField]:
        """Получает все поля блока"""
        return self.db.query(BlockField)\
            .filter(BlockField.block_id == block_id)\
            .order_by(BlockField.order_index)\
            .all()
    
    async def update(self, field: BlockField) -> BlockField:
        """Обновляет поле"""
        self.db.commit()
        self.db.refresh(field)
        logger.info(f"Updated block field: {field.id}")
        return field
    
    async def delete(self, field_id: UUID) -> bool:
        """Удаляет поле"""
        field = self.db.query(BlockField).filter(BlockField.id == field_id).first()
        if not field:
            return False
        
        self.db.delete(field)
        self.db.commit()
        logger.info(f"Deleted block field: {field_id}")
        return True
