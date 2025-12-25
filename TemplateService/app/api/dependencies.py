from fastapi import Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.settings import get_settings
from app.infrastructure.repositories import TemplateBlockRepository
from app.infrastructure.storage_service import MinIOStorageService
from app.infrastructure.pptx_parser import PPTXParser
from app.infrastructure.preview_generator import PreviewGenerator
from app.application.use_cases import (
    GetTemplatesUseCase,
    GetTemplateByIdUseCase,
    UploadTemplateBlockUseCase
)


# Repository dependencies
def get_template_block_repository(db: Session = Depends(get_db)) -> TemplateBlockRepository:
    """Dependency для репозитория блоков"""
    return TemplateBlockRepository(db)


# Use case dependencies
def get_get_templates_use_case(
    block_repo: TemplateBlockRepository = Depends(get_template_block_repository)
) -> GetTemplatesUseCase:
    """Dependency для use case получения списка блоков"""
    return GetTemplatesUseCase(block_repo)


def get_get_template_by_id_use_case(
    block_repo: TemplateBlockRepository = Depends(get_template_block_repository)
) -> GetTemplateByIdUseCase:
    """Dependency для use case получения блока по ID"""
    return GetTemplateByIdUseCase(block_repo)


# Service dependencies
def get_storage_service() -> MinIOStorageService:
    """Dependency для MinIO storage service"""
    settings = get_settings()
    return MinIOStorageService(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        bucket_name=settings.MINIO_BUCKET_NAME,
        secure=False
    )


def get_pptx_parser() -> PPTXParser:
    """Dependency для PPTX parser"""
    return PPTXParser()


def get_preview_generator() -> PreviewGenerator:
    """Dependency для preview generator"""
    return PreviewGenerator()


def get_upload_template_block_use_case(
    block_repo: TemplateBlockRepository = Depends(get_template_block_repository),
    storage_service: MinIOStorageService = Depends(get_storage_service),
    pptx_parser: PPTXParser = Depends(get_pptx_parser),
    preview_generator: PreviewGenerator = Depends(get_preview_generator)
) -> UploadTemplateBlockUseCase:
    """Dependency для use case загрузки блока"""
    return UploadTemplateBlockUseCase(
        block_repo,
        storage_service,
        pptx_parser,
        preview_generator
    )
