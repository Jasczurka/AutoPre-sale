from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from app.domain.entities import TemplateBlock, BlockField


class ITemplateBlockRepository(ABC):
    """Интерфейс репозитория для семантических блоков шаблонов"""
    
    @abstractmethod
    async def create(self, block: TemplateBlock) -> TemplateBlock:
        """Создать блок"""
        pass
    
    @abstractmethod
    async def get_by_id(self, block_id: UUID) -> Optional[TemplateBlock]:
        """Получить блок по ID с его полями"""
        pass
    
    @abstractmethod
    async def get_by_code(self, code: str) -> Optional[TemplateBlock]:
        """Получить блок по коду"""
        pass
    
    @abstractmethod
    async def get_all(self, category: Optional[str] = None) -> List[TemplateBlock]:
        """Получить все блоки (с фильтрацией по категории)"""
        pass
    
    @abstractmethod
    async def update(self, block: TemplateBlock) -> TemplateBlock:
        """Обновить блок"""
        pass
    
    @abstractmethod
    async def delete(self, block_id: UUID) -> bool:
        """Удалить блок"""
        pass


class IBlockFieldRepository(ABC):
    """Интерфейс репозитория для полей блоков"""
    
    @abstractmethod
    async def create(self, field: BlockField) -> BlockField:
        """Создать поле блока"""
        pass
    
    @abstractmethod
    async def create_many(self, fields: List[BlockField]) -> List[BlockField]:
        """Создать несколько полей"""
        pass
    
    @abstractmethod
    async def get_by_block_id(self, block_id: UUID) -> List[BlockField]:
        """Получить все поля блока"""
        pass
    
    @abstractmethod
    async def update(self, field: BlockField) -> BlockField:
        """Обновить поле"""
        pass
    
    @abstractmethod
    async def delete(self, field_id: UUID) -> bool:
        """Удалить поле"""
        pass
