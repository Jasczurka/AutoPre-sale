"""Business logic use cases"""
import logging
import io
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime

from app.domain.entities import Presentation, PresentationSlide, SlideBlock, SlideBlockValue
from app.infrastructure.repositories import (
    PresentationRepository, 
    SlideRepository, 
    BlockRepository,
    BlockValueRepository
)
from app.infrastructure.storage import MinIOStorageService
from app.infrastructure.pptx_service import PPTXService
from app.infrastructure.template_client import TemplateServiceClient
from app.infrastructure.project_client import ProjectServiceClient

logger = logging.getLogger(__name__)


class PresentationUseCase:
    """Use cases for presentation management"""
    
    def __init__(
        self,
        presentation_repo: PresentationRepository,
        storage_service: MinIOStorageService,
        project_client: ProjectServiceClient
    ):
        self.presentation_repo = presentation_repo
        self.storage_service = storage_service
        self.project_client = project_client
    
    async def create_presentation(
        self,
        project_id: UUID,
        name: str,
        auth_token: str
    ) -> Presentation:
        """
        Create a new presentation
        
        Args:
            project_id: UUID of the project
            name: Presentation name
            auth_token: JWT token for authentication
            
        Returns:
            Created presentation
        """
        # Verify project exists
        project_exists = await self.project_client.check_project_exists(project_id, auth_token)
        if not project_exists:
            raise ValueError(f"Project {project_id} not found")
        
        # Create empty PPTX
        pptx_data = PPTXService.create_empty_presentation()
        
        # Upload to MinIO
        object_name = f"presentations/{uuid4()}.pptx"
        file_url = self.storage_service.upload_file(
            io.BytesIO(pptx_data),
            object_name
        )
        
        # Create presentation entity
        presentation = Presentation(
            id=uuid4(),
            project_id=project_id,
            name=name,
            status="Draft",
            file_url=file_url
        )
        
        return self.presentation_repo.create(presentation)
    
    def get_presentation(self, presentation_id: UUID) -> Optional[Presentation]:
        """Get presentation by ID"""
        return self.presentation_repo.get_by_id(presentation_id)
    
    def get_all_presentations(self, skip: int = 0, limit: int = 100) -> List[Presentation]:
        """Get all presentations"""
        return self.presentation_repo.get_all(skip, limit)
    
    def delete_presentation(self, presentation_id: UUID) -> bool:
        """Delete presentation"""
        presentation = self.presentation_repo.get_by_id(presentation_id)
        if not presentation:
            return False
        
        # Delete file from MinIO
        if presentation.file_url:
            object_name = presentation.file_url  # file_url already contains just the object_name
            self.storage_service.delete_file(object_name)
        
        return self.presentation_repo.delete(presentation_id)


class SlideUseCase:
    """Use cases for slide management"""
    
    def __init__(
        self,
        presentation_repo: PresentationRepository,
        slide_repo: SlideRepository,
        storage_service: MinIOStorageService
    ):
        self.presentation_repo = presentation_repo
        self.slide_repo = slide_repo
        self.storage_service = storage_service
    
    def add_slide(self, presentation_id: UUID, layout_index: int = 6) -> PresentationSlide:
        """
        Add a new slide to presentation
        
        Args:
            presentation_id: UUID of the presentation
            layout_index: Slide layout index (6=blank)
            
        Returns:
            Created slide
        """
        # Get presentation
        presentation = self.presentation_repo.get_by_id(presentation_id)
        if not presentation:
            raise ValueError(f"Presentation {presentation_id} not found")
        
        # Download current PPTX
        object_name = presentation.file_url  # file_url already contains just the object_name
        pptx_data = self.storage_service.download_file(object_name)
        
        # Add slide
        prs = PPTXService.load_presentation(pptx_data)
        slide_index = PPTXService.add_slide(prs, layout_index)
        
        # Save updated PPTX
        updated_pptx = PPTXService.save_presentation(prs)
        self.storage_service.upload_file(io.BytesIO(updated_pptx), object_name)
        
        # Create slide entity
        existing_slides = self.slide_repo.get_by_presentation(presentation_id)
        order_index = len(existing_slides)
        
        slide = PresentationSlide(
            id=uuid4(),
            presentation_id=presentation_id,
            order_index=order_index
        )
        
        # Update presentation timestamp
        presentation.updated_at = datetime.utcnow()
        self.presentation_repo.update(presentation)
        
        return self.slide_repo.create(slide)
    
    def get_slides(self, presentation_id: UUID) -> List[PresentationSlide]:
        """Get all slides for a presentation"""
        return self.slide_repo.get_by_presentation(presentation_id)
    
    def delete_slide(self, presentation_id: UUID, slide_id: UUID) -> bool:
        """
        Delete a slide from presentation
        
        Args:
            presentation_id: UUID of the presentation
            slide_id: UUID of the slide to delete
            
        Returns:
            True if deleted successfully
        """
        # Get presentation
        presentation = self.presentation_repo.get_by_id(presentation_id)
        if not presentation:
            raise ValueError(f"Presentation {presentation_id} not found")
        
        # Get slide
        slide = self.slide_repo.get_by_id(slide_id)
        if not slide or slide.presentation_id != presentation_id:
            return False
        
        # Download current PPTX
        object_name = presentation.file_url
        pptx_data = self.storage_service.download_file(object_name)
        
        # Load presentation and delete slide
        prs = PPTXService.load_presentation(pptx_data)
        
        # Delete slide from PPTX
        if slide.order_index < len(prs.slides):
            rId = prs.slides._sldIdLst[slide.order_index].rId
            prs.part.drop_rel(rId)
            del prs.slides._sldIdLst[slide.order_index]
        
        # Save updated PPTX
        updated_pptx = PPTXService.save_presentation(prs)
        self.storage_service.upload_file(io.BytesIO(updated_pptx), object_name)
        
        # Delete slide entity
        success = self.slide_repo.delete(slide_id)
        
        # Update presentation timestamp
        if success:
            presentation.updated_at = datetime.utcnow()
            self.presentation_repo.update(presentation)
        
        return success


class BlockUseCase:
    """Use cases for block management"""
    
    def __init__(
        self,
        presentation_repo: PresentationRepository,
        slide_repo: SlideRepository,
        block_repo: BlockRepository,
        value_repo: BlockValueRepository,
        storage_service: MinIOStorageService,
        template_client: TemplateServiceClient
    ):
        self.presentation_repo = presentation_repo
        self.slide_repo = slide_repo
        self.block_repo = block_repo
        self.value_repo = value_repo
        self.storage_service = storage_service
        self.template_client = template_client
    
    async def add_block_to_slide(
        self,
        presentation_id: UUID,
        slide_index: int,
        template_block_id: UUID
    ) -> SlideBlock:
        """
        Add a template block to a slide
        
        Args:
            presentation_id: UUID of the presentation
            slide_index: Index of the slide
            template_block_id: UUID of the template block
            
        Returns:
            Created block
        """
        # Get presentation
        presentation = self.presentation_repo.get_by_id(presentation_id)
        if not presentation:
            raise ValueError(f"Presentation {presentation_id} not found")
        
        # Get slide
        slides = self.slide_repo.get_by_presentation(presentation_id)
        if slide_index >= len(slides):
            raise ValueError(f"Slide index {slide_index} out of range")
        
        slide = slides[slide_index]
        
        # Download block PPTX from template service
        block_pptx_data = await self.template_client.download_block_pptx(template_block_id)
        if not block_pptx_data:
            raise ValueError(f"Could not download template block {template_block_id}")
        
        # Download current presentation PPTX
        object_name = presentation.file_url  # file_url already contains just the object_name
        pptx_data = self.storage_service.download_file(object_name)
        
        # Load presentation and copy shapes from block
        prs = PPTXService.load_presentation(pptx_data)
        success = PPTXService.copy_shapes_from_block(prs, block_pptx_data, slide_index)
        
        if not success:
            raise ValueError("Failed to copy shapes from block")
        
        # Save updated PPTX
        updated_pptx = PPTXService.save_presentation(prs)
        self.storage_service.upload_file(io.BytesIO(updated_pptx), object_name)
        
        # Create block entity
        existing_blocks = self.block_repo.get_by_slide(slide.id)
        position_index = len(existing_blocks)
        
        block = SlideBlock(
            id=uuid4(),
            slide_id=slide.id,
            template_block_id=template_block_id,
            position_index=position_index
        )
        
        # Update presentation timestamp
        presentation.updated_at = datetime.utcnow()
        self.presentation_repo.update(presentation)
        
        return self.block_repo.create(block)
    
    async def update_block_values(
        self,
        presentation_id: UUID,
        block_id: UUID,
        values: Dict[str, Any]
    ) -> SlideBlock:
        """
        Update placeholder values in a block
        
        Args:
            presentation_id: UUID of the presentation
            block_id: UUID of the block
            values: Dictionary of field_key: value pairs
            
        Returns:
            Updated block
        """
        # Get presentation
        presentation = self.presentation_repo.get_by_id(presentation_id)
        if not presentation:
            raise ValueError(f"Presentation {presentation_id} not found")
        
        # Get block
        block = self.block_repo.get_by_id(block_id)
        if not block:
            raise ValueError(f"Block {block_id} not found")
        
        # Update values in database
        for field_key, value in values.items():
            self.value_repo.upsert(block_id, field_key, {"value": value})
        
        # Download current presentation PPTX
        object_name = presentation.file_url  # file_url already contains just the object_name
        pptx_data = self.storage_service.download_file(object_name)
        
        # Load presentation and replace placeholders
        prs = PPTXService.load_presentation(pptx_data)
        
        # Get slide index
        slide = self.slide_repo.get_by_id(block.slide_id)
        replacements = {k: str(v) for k, v in values.items()}
        
        PPTXService.replace_placeholders(prs, slide.order_index, replacements)
        
        # Save updated PPTX
        updated_pptx = PPTXService.save_presentation(prs)
        self.storage_service.upload_file(io.BytesIO(updated_pptx), object_name)
        
        # Update presentation timestamp
        presentation.updated_at = datetime.utcnow()
        self.presentation_repo.update(presentation)
        
        return self.block_repo.get_by_id(block_id)
    
    async def delete_block(
        self,
        presentation_id: UUID,
        slide_id: UUID,
        block_id: UUID
    ) -> bool:
        """
        Delete a block from a slide
        
        Args:
            presentation_id: UUID of the presentation
            slide_id: UUID of the slide
            block_id: UUID of the block to delete
            
        Returns:
            True if deleted successfully
        """
        # Get presentation
        presentation = self.presentation_repo.get_by_id(presentation_id)
        if not presentation:
            raise ValueError(f"Presentation {presentation_id} not found")
        
        # Get block
        block = self.block_repo.get_by_id(block_id)
        if not block or block.slide_id != slide_id:
            return False
        
        # Delete block entity (cascade will delete values)
        success = self.block_repo.delete(block_id)
        
        # Note: We're not removing shapes from PPTX here as it's complex
        # The shapes will remain in the file but won't have associated data
        # If you want to remove shapes, you'd need to track shape positions
        
        # Update presentation timestamp
        if success:
            presentation.updated_at = datetime.utcnow()
            self.presentation_repo.update(presentation)
        
        return success


class GenerationUseCase:
    """Use cases for presentation generation/finalization"""
    
    def __init__(
        self,
        presentation_repo: PresentationRepository,
        storage_service: MinIOStorageService
    ):
        self.presentation_repo = presentation_repo
        self.storage_service = storage_service
    
    def generate_presentation(self, presentation_id: UUID) -> Presentation:
        """
        Finalize and generate the presentation
        
        Args:
            presentation_id: UUID of the presentation
            
        Returns:
            Updated presentation
        """
        # Get presentation
        presentation = self.presentation_repo.get_by_id(presentation_id)
        if not presentation:
            raise ValueError(f"Presentation {presentation_id} not found")
        
        # Update status to Generated
        presentation.status = "Generated"
        presentation.updated_at = datetime.utcnow()
        
        return self.presentation_repo.update(presentation)
