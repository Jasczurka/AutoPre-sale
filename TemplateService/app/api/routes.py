from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional
from uuid import UUID
import io

from app.application.use_cases import (
    GetTemplatesUseCase,
    GetTemplateByIdUseCase,
    UploadTemplateBlockUseCase
)
from app.application.dtos import (
    TemplateBlockListItemDto,
    TemplateBlockDto,
    ErrorResponseDto
)
from app.application.errors import GetTemplateError
from app.api.dependencies import (
    get_get_templates_use_case,
    get_get_template_by_id_use_case,
    get_upload_template_block_use_case,
    get_storage_service
)
from app.infrastructure.storage_service import MinIOStorageService

# Публичные роуты
public_router = APIRouter(prefix="/api/Templates", tags=["Templates"])


@public_router.get(
    "",
    response_model=List[TemplateBlockListItemDto],
    summary="Получить список всех блоков шаблонов",
    description="Возвращает список семантических блоков презентаций"
)
async def get_templates(
    category: Optional[str] = Query(None, description="Фильтр по категории блоков"),
    use_case: GetTemplatesUseCase = Depends(get_get_templates_use_case)
):
    """
    Получить список всех семантических блоков шаблонов
    
    - **category**: Опциональная фильтрация по категории (overview, technical, roadmap и т.п.)
    
    Возвращает список блоков с минимальной информацией: id, code, name, previewUrl
    """
    try:
        return await use_case.execute(category=category)
    except GetTemplateError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": e.message, "code": e.code, "details": e.details}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "code": "internal_error"}
        )


@public_router.get(
    "/{id}",
    response_model=TemplateBlockDto,
    summary="Получить блок по ID",
    description="Возвращает полную информацию о семантическом блоке, включая список его полей"
)
async def get_template_by_id(
    id: UUID,
    use_case: GetTemplateByIdUseCase = Depends(get_get_template_by_id_use_case)
):
    """
    Получить полную информацию о блоке по ID
    
    Возвращает:
    - Полную информацию о блоке (id, code, name, description, category)
    - Ссылки на pptx файл и превью
    - Список полей блока с их типами и метаданными
    """
    try:
        return await use_case.execute(id)
    except GetTemplateError as e:
        status_code = status.HTTP_404_NOT_FOUND if e.code == "template.not_found" else status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=status_code,
            detail={"error": e.message, "code": e.code, "details": e.details}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "code": "internal_error"}
        )


@public_router.get(
    "/{id}/download",
    summary="Скачать PPTX файл блока",
    description="Возвращает PPTX файл семантического блока"
)
async def download_template_block(
    id: UUID,
    use_case: GetTemplateByIdUseCase = Depends(get_get_template_by_id_use_case),
    storage: MinIOStorageService = Depends(get_storage_service)
):
    """
    Скачать PPTX файл блока
    
    Возвращает PPTX файл для использования в других сервисах
    """
    try:
        # Get template metadata
        template = await use_case.execute(id)
        
        if not template.pptxFileUrl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "PPTX файл не найден для данного блока", "code": "file_not_found"}
            )
        
        # Extract object name from URL
        # pptxFileUrl format: http://minio:9000/bucket_name/object_name
        # We need just the object_name part
        object_name = template.pptxFileUrl
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Original pptx_url: {object_name}")
        logger.info(f"Bucket name: {storage.bucket_name}")
        
        if "://" in object_name:
            # URL format - extract path after bucket name
            parts = object_name.split("/")
            logger.info(f"URL parts: {parts}")
            
            # Skip protocol and domain (first 3 parts: ['http:', '', 'minio:9000'])
            # Then skip bucket name (4th part)
            # Take everything after that
            if len(parts) > 3:
                # Parts: ['http:', '', 'minio:9000', 'bucket', 'path', 'to', 'file.pptx']
                # We want: 'path/to/file.pptx' (skip first 4 parts)
                object_name = "/".join(parts[4:])
                logger.info(f"Extracted object_name: {object_name}")
            else:
                raise ValueError(f"Invalid URL format: {template.pptxFileUrl}")
        
        # Download file from MinIO
        logger.info(f"Downloading from MinIO: {object_name}")
        file_data = storage.download_file(object_name)
        logger.info(f"Downloaded {len(file_data)} bytes")
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={
                "Content-Disposition": f'attachment; filename="{template.code}.pptx"',
                "Content-Length": str(len(file_data))
            }
        )
    except GetTemplateError as e:
        status_code = status.HTTP_404_NOT_FOUND if e.code == "template.not_found" else status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=status_code,
            detail={"error": e.message, "code": e.code, "details": e.details}
        )
    except HTTPException:
        raise
    except Exception as e:
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        logger.error(f"Error in download_template_block: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "code": "internal_error", "traceback": traceback.format_exc()}
        )


@public_router.post(
    "",
    response_model=TemplateBlockDto,
    status_code=status.HTTP_201_CREATED,
    summary="Загрузить новый блок",
    description="Загружает новый семантический блок из PPTX файла"
)
async def upload_template_block(
    file: UploadFile = File(..., description="PPTX файл блока"),
    code: str = Form(..., description="Уникальный код блока"),
    name: str = Form(..., description="Название блока"),
    description: Optional[str] = Form(None, description="Описание блока"),
    category: Optional[str] = Form(None, description="Категория блока"),
    use_case: UploadTemplateBlockUseCase = Depends(get_upload_template_block_use_case)
):
    """
    Загрузить новый семантический блок из PPTX файла
    
    - **file**: PPTX файл блока
    - **code**: Уникальный код блока (например: project_overview)
    - **name**: Человекочитаемое название блока
    - **description**: Описание назначения блока (опционально)
    - **category**: Категория блока (опционально)
    
    Возвращает созданный блок с автоматически извлеченными полями
    """
    try:
        # Проверяем формат файла
        if not file.filename.endswith('.pptx'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "Неверный формат файла. Ожидается .pptx", "code": "invalid_file_format"}
            )
        
        # Читаем данные файла
        file_data = await file.read()
        file_stream = io.BytesIO(file_data)
        
        # Вызываем use case
        result = await use_case.execute(
            code=code,
            name=name,
            description=description,
            category=category,
            file_data=file_stream,
            filename=file.filename
        )
        
        return result
        
    except GetTemplateError as e:
        status_code = status.HTTP_400_BAD_REQUEST
        if e.code == "template.validation_error":
            status_code = status.HTTP_409_CONFLICT
        raise HTTPException(
            status_code=status_code,
            detail={"error": e.message, "code": e.code, "details": e.details}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e), "code": "internal_error"}
        )
