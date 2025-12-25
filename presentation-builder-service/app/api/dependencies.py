"""FastAPI dependencies"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import jwt
from jwt.exceptions import InvalidTokenError
import logging

from app.config.database import get_db
from app.config.settings import settings

logger = logging.getLogger(__name__)
from app.infrastructure.repositories import (
    PresentationRepository,
    SlideRepository,
    BlockRepository,
    BlockValueRepository
)
from app.infrastructure.storage import MinIOStorageService
from app.infrastructure.template_client import TemplateServiceClient
from app.infrastructure.project_client import ProjectServiceClient
from app.application.use_cases import (
    PresentationUseCase,
    SlideUseCase,
    BlockUseCase,
    GenerationUseCase
)


# Repository dependencies
def get_presentation_repository(db: Session = Depends(get_db)) -> PresentationRepository:
    """Get presentation repository"""
    return PresentationRepository(db)


def get_slide_repository(db: Session = Depends(get_db)) -> SlideRepository:
    """Get slide repository"""
    return SlideRepository(db)


def get_block_repository(db: Session = Depends(get_db)) -> BlockRepository:
    """Get block repository"""
    return BlockRepository(db)


def get_block_value_repository(db: Session = Depends(get_db)) -> BlockValueRepository:
    """Get block value repository"""
    return BlockValueRepository(db)


# Service dependencies
def get_storage_service() -> MinIOStorageService:
    """Get MinIO storage service"""
    return MinIOStorageService()


def get_template_client() -> TemplateServiceClient:
    """Get template service client"""
    return TemplateServiceClient()


def get_project_client() -> ProjectServiceClient:
    """Get project service client"""
    return ProjectServiceClient()


# Use case dependencies
def get_presentation_use_case(
    presentation_repo: PresentationRepository = Depends(get_presentation_repository),
    storage_service: MinIOStorageService = Depends(get_storage_service),
    project_client: ProjectServiceClient = Depends(get_project_client)
) -> PresentationUseCase:
    """Get presentation use case"""
    return PresentationUseCase(presentation_repo, storage_service, project_client)


def get_slide_use_case(
    presentation_repo: PresentationRepository = Depends(get_presentation_repository),
    slide_repo: SlideRepository = Depends(get_slide_repository),
    storage_service: MinIOStorageService = Depends(get_storage_service)
) -> SlideUseCase:
    """Get slide use case"""
    return SlideUseCase(presentation_repo, slide_repo, storage_service)


def get_block_use_case(
    presentation_repo: PresentationRepository = Depends(get_presentation_repository),
    slide_repo: SlideRepository = Depends(get_slide_repository),
    block_repo: BlockRepository = Depends(get_block_repository),
    value_repo: BlockValueRepository = Depends(get_block_value_repository),
    storage_service: MinIOStorageService = Depends(get_storage_service),
    template_client: TemplateServiceClient = Depends(get_template_client)
) -> BlockUseCase:
    """Get block use case"""
    return BlockUseCase(
        presentation_repo,
        slide_repo,
        block_repo,
        value_repo,
        storage_service,
        template_client
    )


def get_generation_use_case(
    presentation_repo: PresentationRepository = Depends(get_presentation_repository),
    storage_service: MinIOStorageService = Depends(get_storage_service)
) -> GenerationUseCase:
    """Get generation use case"""
    return GenerationUseCase(presentation_repo, storage_service)


# JWT authentication dependency
async def verify_jwt_token(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify JWT token from Authorization header
    
    Args:
        authorization: Authorization header value
        
    Returns:
        JWT token string
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    if not authorization:
        logger.warning("Missing authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    try:
        logger.debug(f"Authorization header received (length: {len(authorization)})")
        # Extract token from "Bearer <token>"
        parts = authorization.split(None, 1)  # Split on first whitespace only
        if len(parts) != 2:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format"
            )
        
        scheme, token = parts
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
        
        # Prepare public key for RSA verification
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend
        import base64
        
        # Decode public key from base64
        public_key_bytes = base64.b64decode(settings.JWT_PUBLIC_KEY)
        
        # Load the public key
        public_key = serialization.load_der_public_key(
            public_key_bytes,
            backend=default_backend()
        )
        
        # Verify token with RSA public key
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER
        )
        
        logger.info(f"JWT token validated successfully for user: {payload.get('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier', 'unknown')}")
        return token
        
    except ValueError as e:
        logger.error(f"ValueError parsing authorization header: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    except InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Token verification failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )
