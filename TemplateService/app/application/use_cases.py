from typing import List, Optional, BinaryIO
from uuid import UUID, uuid4
import logging
from datetime import datetime

from app.domain.repositories import ITemplateBlockRepository
from app.domain.entities import TemplateBlock, BlockField
from app.application.dtos import (
    TemplateBlockListItemDto,
    TemplateBlockDto,
    BlockFieldDto
)
from app.application.errors import GetTemplateError
from app.infrastructure.storage_service import MinIOStorageService
from app.infrastructure.pptx_parser import PPTXParser
from app.infrastructure.preview_generator import PreviewGenerator

logger = logging.getLogger(__name__)


class GetTemplatesUseCase:
    """Use case для получения списка всех блоков"""
    
    def __init__(self, block_repository: ITemplateBlockRepository):
        self.block_repository = block_repository
    
    async def execute(self, category: Optional[str] = None) -> List[TemplateBlockListItemDto]:
        """
        Получить список всех блоков шаблонов
        
        Args:
            category: Фильтр по категории (опционально)
        
        Returns:
            Список упрощенных DTO блоков
        """
        try:
            logger.info(f"Getting all template blocks (category={category})")
            blocks = await self.block_repository.get_all(category=category)
            
            result = []
            for block in blocks:
                result.append(TemplateBlockListItemDto(
                    id=block.id,
                    code=block.code,
                    name=block.name,
                    previewUrl=block.preview_png_url
                ))
            
            logger.info(f"Found {len(result)} template blocks")
            return result
            
        except Exception as e:
            logger.error(f"Error getting templates: {str(e)}")
            raise GetTemplateError.database_error(str(e))


class GetTemplateByIdUseCase:
    """Use case для получения блока по ID"""
    
    def __init__(self, block_repository: ITemplateBlockRepository):
        self.block_repository = block_repository
    
    async def execute(self, block_id: UUID) -> TemplateBlockDto:
        """
        Получить полную информацию о блоке по ID
        
        Args:
            block_id: ID блока
        
        Returns:
            Полный DTO блока с полями
        """
        try:
            logger.info(f"Getting template block by id: {block_id}")
            block = await self.block_repository.get_by_id(block_id)
            
            if not block:
                logger.warning(f"Template block not found: {block_id}")
                raise GetTemplateError.not_found()
            
            # Преобразуем поля
            fields = []
            for field in block.fields:
                fields.append(BlockFieldDto(
                    key=field.field_key,
                    type=field.type,
                    required=field.required,
                    placeholder=field.placeholder,
                    order_index=field.order_index,
                    metadata=field.field_metadata
                ))
            
            result = TemplateBlockDto(
                id=block.id,
                code=block.code,
                name=block.name,
                description=block.description,
                category=block.category,
                pptxFileUrl=block.pptx_file_url,
                previewUrl=block.preview_png_url,
                fields=fields,
                created_at=block.created_at,
                updated_at=block.updated_at
            )
            
            logger.info(f"Successfully retrieved template block: {block_id}")
            return result
            
        except GetTemplateError:
            raise
        except Exception as e:
            logger.error(f"Error getting template by id: {str(e)}")
            raise GetTemplateError.database_error(str(e))


class UploadTemplateBlockUseCase:
    """Use case для загрузки нового блока из PPTX файла"""
    
    def __init__(
        self, 
        block_repository: ITemplateBlockRepository,
        storage_service: MinIOStorageService,
        pptx_parser: PPTXParser,
        preview_generator: PreviewGenerator
    ):
        self.block_repository = block_repository
        self.storage_service = storage_service
        self.pptx_parser = pptx_parser
        self.preview_generator = preview_generator
    
    async def execute(
        self, 
        code: str,
        name: str,
        description: Optional[str],
        category: Optional[str],
        file_data: BinaryIO,
        filename: str
    ) -> TemplateBlockDto:
        """
        Загрузить новый блок из PPTX файла
        
        Args:
            code: Уникальный код блока
            name: Название блока
            description: Описание блока
            category: Категория блока
            file_data: Данные PPTX файла
            filename: Имя файла
        
        Returns:
            Созданный блок
        """
        try:
            logger.info(f"Uploading new template block: {code}")
            
            # Проверяем, не существует ли уже блок с таким кодом
            existing_block = await self.block_repository.get_by_code(code)
            if existing_block:
                logger.error(f"Block with code {code} already exists")
                raise GetTemplateError.validation_error(f"Блок с кодом '{code}' уже существует")
            
            # Генерируем ID для блока
            block_id = uuid4()
            
            # Загружаем PPTX файл в MinIO
            pptx_object_name = f"templates/{block_id}/{filename}"
            pptx_url = await self.storage_service.upload_file(
                file_data,
                pptx_object_name,
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
            logger.info(f"PPTX file uploaded: {pptx_url}")
            
            # Парсим PPTX для извлечения полей
            file_data.seek(0)  # Возвращаемся в начало файла
            file_bytes = file_data.read()
            parsed_data = self.pptx_parser.parse_presentation(file_bytes)
            logger.info(f"Parsed {len(parsed_data)} blocks from PPTX")
            
            # Генерируем превью
            file_data.seek(0)
            preview_data = await self.preview_generator.generate_preview(file_data)
            preview_object_name = f"templates/{block_id}/preview.png"
            preview_url = await self.storage_service.upload_file(
                preview_data,
                preview_object_name,
                "image/png"
            )
            logger.info(f"Preview generated: {preview_url}")
            
            # Создаем блок в БД
            block = TemplateBlock(
                id=block_id,
                code=code,
                name=name,
                description=description,
                category=category,
                pptx_file_url=pptx_url,
                preview_png_url=preview_url,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # Извлекаем поля из парсированных данных
            fields = []
            order_index = 0
            
            # Группируем блоки по слайдам и создаем поля
            for block_data in parsed_data:
                placeholders_found = block_data.get("placeholders", [])
                
                if placeholders_found:
                    # Используем плейсхолдеры из текста
                    for ph in placeholders_found:
                        field_key = ph['name']  # title
                        placeholder = ph['full']  # {{title.about_project}}
                        field_type = block_data.get("type", "text")
                        
                        # Создаем метаданные поля, включая информацию о позиции и схеме
                        metadata = {
                            "label": ph['label'],  # about_project
                            "slide_number": block_data.get("slide_number", 1),
                            "position": block_data.get("position", {}),
                            "size": block_data.get("size", {}),
                            "value_schema": block_data.get("value_schema", {}),
                            **block_data.get("block_metadata", {})
                        }
                        
                        field = BlockField(
                            id=uuid4(),
                            block_id=block_id,
                            field_key=field_key,
                            placeholder=placeholder,
                            type=field_type,
                            required=False,
                            order_index=order_index,
                            field_metadata=metadata
                        )
                        fields.append(field)
                        order_index += 1
                else:
                    # Старая логика для обратной совместимости (если плейсхолдеры не найдены)
                    field_key = block_data.get("key", f"field_{order_index}")
                    field_type = block_data.get("type", "text")
                    
                    # Формируем placeholder в стандартном формате
                    placeholder = f"{{{{ {field_type}.{field_key} }}}}"
                    
                    # Создаем метаданные поля, включая информацию о позиции и схеме
                    metadata = {
                        "slide_number": block_data.get("slide_number", 1),
                        "position": block_data.get("position", {}),
                        "size": block_data.get("size", {}),
                        "value_schema": block_data.get("value_schema", {}),
                        **block_data.get("block_metadata", {})
                    }
                    
                    field = BlockField(
                        id=uuid4(),
                        block_id=block_id,
                        field_key=field_key,
                        placeholder=placeholder,
                        type=field_type,
                        required=False,
                        order_index=order_index,
                        field_metadata=metadata
                    )
                    fields.append(field)
                    order_index += 1
            
            logger.info(f"Created {len(fields)} fields from parsed data")
            
            block.fields = fields
            
            # Сохраняем в БД
            created_block = await self.block_repository.create(block)
            logger.info(f"Template block created successfully: {created_block.id}")
            
            # Формируем DTO для ответа
            fields_dto = []
            for field in created_block.fields:
                fields_dto.append(BlockFieldDto(
                    key=field.field_key,
                    type=field.type,
                    required=field.required,
                    placeholder=field.placeholder,
                    order_index=field.order_index,
                    metadata=field.field_metadata
                ))
            
            result = TemplateBlockDto(
                id=created_block.id,
                code=created_block.code,
                name=created_block.name,
                description=created_block.description,
                category=created_block.category,
                pptxFileUrl=created_block.pptx_file_url,
                previewUrl=created_block.preview_png_url,
                fields=fields_dto,
                created_at=created_block.created_at,
                updated_at=created_block.updated_at
            )
            
            return result
            
        except GetTemplateError:
            raise
        except Exception as e:
            logger.error(f"Error uploading template block: {str(e)}")
            raise GetTemplateError.database_error(str(e))
