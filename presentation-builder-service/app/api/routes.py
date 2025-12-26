"""API routes for Presentation Builder Service"""
import logging
from typing import List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
import io

from app.application.dtos import (
    CreatePresentationRequest,
    AddSlideRequest,
    AddBlockRequest,
    UpdateBlockValuesRequest,
    PresentationResponse,
    SlideResponse,
    BlockResponse,
    GenerateResponse,
    ErrorResponse
)
from app.application.use_cases import (
    PresentationUseCase,
    SlideUseCase,
    BlockUseCase,
    GenerationUseCase
)
from app.api.dependencies import (
    get_presentation_use_case,
    get_slide_use_case,
    get_block_use_case,
    get_generation_use_case,
    verify_jwt_token,
    get_storage_service
)
from app.infrastructure.storage import MinIOStorageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["presentations"])


# Presentation endpoints
@router.post("/presentations", response_model=PresentationResponse, status_code=status.HTTP_201_CREATED)
async def create_presentation(
    request: CreatePresentationRequest,
    token: str = Depends(verify_jwt_token),
    use_case: PresentationUseCase = Depends(get_presentation_use_case)
):
    """
    Create a new presentation
    
    Creates an empty PPTX file with one blank slide and stores it in MinIO.
    """
    try:
        presentation = await use_case.create_presentation(
            request.project_id,
            request.name,
            token
        )
        response = PresentationResponse.model_validate(presentation)
        # Use by_alias=True to return camelCase and include slides
        return JSONResponse(content=response.model_dump(by_alias=True, mode='json'))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating presentation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/presentations/{presentation_id}")
async def get_presentation(
    presentation_id: UUID,
    token: str = Depends(verify_jwt_token),
    use_case: PresentationUseCase = Depends(get_presentation_use_case)
):
    """Get presentation by ID"""
    presentation = use_case.get_presentation(presentation_id)
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")
    response = PresentationResponse.model_validate(presentation)
    # Use by_alias=True to get camelCase
    return JSONResponse(content=response.model_dump(by_alias=True, mode='json'))


@router.get("/presentations")
async def get_presentations(
    skip: int = 0,
    limit: int = 100,
    token: str = Depends(verify_jwt_token),
    use_case: PresentationUseCase = Depends(get_presentation_use_case)
):
    """Get all presentations"""
    presentations = use_case.get_all_presentations(skip, limit)
    # Use by_alias=True to get camelCase
    presentations_data = [PresentationResponse.model_validate(p).model_dump(by_alias=True, mode='json') for p in presentations]
    return JSONResponse(content=presentations_data)


@router.delete("/presentations/{presentation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_presentation(
    presentation_id: UUID,
    token: str = Depends(verify_jwt_token),
    use_case: PresentationUseCase = Depends(get_presentation_use_case)
):
    """Delete a presentation"""
    success = use_case.delete_presentation(presentation_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")


# Slide endpoints
@router.post("/presentations/{presentation_id}/slides", response_model=SlideResponse, status_code=status.HTTP_201_CREATED)
async def add_slide(
    presentation_id: UUID,
    request: AddSlideRequest = AddSlideRequest(),
    token: str = Depends(verify_jwt_token),
    use_case: SlideUseCase = Depends(get_slide_use_case)
):
    """
    Add a new slide to presentation
    
    Downloads the current PPTX, adds a blank slide, and saves it back to MinIO.
    """
    try:
        slide = use_case.add_slide(presentation_id, request.clone_from_index, request.layout_index)
        response = SlideResponse.model_validate(slide)
        # Use by_alias=True to return camelCase
        return JSONResponse(content=response.model_dump(by_alias=True, mode='json'))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding slide: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/presentations/{presentation_id}/slides")
async def get_slides(
    presentation_id: UUID,
    token: str = Depends(verify_jwt_token),
    use_case: SlideUseCase = Depends(get_slide_use_case)
):
    """Get all slides for a presentation"""
    slides = use_case.get_slides(presentation_id)
    # Use by_alias=True and mode='json' to get camelCase with slideNumber
    slides_data = [SlideResponse.model_validate(s).model_dump(by_alias=True, mode='json') for s in slides]
    return JSONResponse(content=slides_data)


@router.delete("/presentations/{presentation_id}/slides/{slide_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slide(
    presentation_id: UUID,
    slide_id: UUID,
    token: str = Depends(verify_jwt_token),
    use_case: SlideUseCase = Depends(get_slide_use_case)
):
    """Delete a slide from presentation"""
    try:
        success = use_case.delete_slide(presentation_id, slide_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slide not found")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting slide: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# Block endpoints
@router.post("/presentations/{presentation_id}/slides/{slide_index}/blocks", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
async def add_block_to_slide(
    presentation_id: UUID,
    slide_index: int,
    request: AddBlockRequest,
    token: str = Depends(verify_jwt_token),
    use_case: BlockUseCase = Depends(get_block_use_case)
):
    """
    Add a template block to a slide (by slide index)
    
    Downloads the block PPTX from TemplateService, copies shapes to the target slide,
    and saves the updated presentation.
    """
    try:
        # Extract block ID from request
        template_block_id = request.get_block_id()
        
        block = await use_case.add_block_to_slide(
            presentation_id,
            slide_index,
            template_block_id
        )
        return BlockResponse.model_validate(block)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding block: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/presentations/{presentation_id}/slides/{slide_id}", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
async def add_block_to_slide_by_id(
    presentation_id: UUID,
    slide_id: UUID,
    request: AddBlockRequest,
    token: str = Depends(verify_jwt_token),
    use_case: BlockUseCase = Depends(get_block_use_case),
    slide_use_case: SlideUseCase = Depends(get_slide_use_case)
):
    """
    Add a template block to a slide (by slide ID)
    
    Alternative endpoint for frontend that uses slide_id instead of slide_index.
    """
    try:
        # Get all slides to find the index of the given slide_id
        slides = slide_use_case.get_slides(presentation_id)
        slide_index = None
        for idx, slide in enumerate(slides):
            if slide.id == slide_id:
                slide_index = idx
                break
        
        if slide_index is None:
            raise ValueError(f"Slide {slide_id} not found in presentation")
        
        # Extract block ID from request
        template_block_id = request.get_block_id()
        
        block = await use_case.add_block_to_slide(
            presentation_id,
            slide_index,
            template_block_id
        )
        return BlockResponse.model_validate(block)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding block: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/presentations/{presentation_id}/blocks/{block_id}", response_model=BlockResponse)
async def update_block_values(
    presentation_id: UUID,
    block_id: UUID,
    request: UpdateBlockValuesRequest,
    token: str = Depends(verify_jwt_token),
    use_case: BlockUseCase = Depends(get_block_use_case)
):
    """
    Update placeholder values in a block
    
    Downloads the presentation, replaces placeholders with actual values,
    and saves the updated presentation.
    """
    try:
        block = await use_case.update_block_values(
            presentation_id,
            block_id,
            request.values
        )
        return BlockResponse.model_validate(block)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating block values: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/presentations/{presentation_id}/slides/{slide_id}/blocks/{block_id}", response_model=BlockResponse)
async def update_block_values_by_slide_id(
    presentation_id: UUID,
    slide_id: UUID,
    block_id: UUID,
    request: UpdateBlockValuesRequest,
    token: str = Depends(verify_jwt_token),
    use_case: BlockUseCase = Depends(get_block_use_case)
):
    """
    Update placeholder values in a block (alternative endpoint with slide_id in path)
    
    This is the same as update_block_values but includes slide_id in the URL path
    for frontend consistency. The slide_id is not used in the logic since we
    can identify the block directly by block_id.
    """
    try:
        block = await use_case.update_block_values(
            presentation_id,
            block_id,
            request.values
        )
        return BlockResponse.model_validate(block)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating block values: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/presentations/{presentation_id}/slides/{slide_id}/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block(
    presentation_id: UUID,
    slide_id: UUID,
    block_id: UUID,
    token: str = Depends(verify_jwt_token),
    use_case: BlockUseCase = Depends(get_block_use_case)
):
    """Delete a block from a slide"""
    try:
        success = await use_case.delete_block(presentation_id, slide_id, block_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting block: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# Generation endpoint
@router.post("/presentations/{presentation_id}/generate", response_model=GenerateResponse)
async def generate_presentation(
    presentation_id: UUID,
    token: str = Depends(verify_jwt_token),
    use_case: GenerationUseCase = Depends(get_generation_use_case)
):
    """
    Finalize and generate the presentation
    
    Updates the presentation status to 'Generated' and returns the final file URL.
    """
    try:
        presentation = use_case.generate_presentation(presentation_id)
        return GenerateResponse(
            presentation_id=presentation.id,
            status=presentation.status,
            file_url=presentation.file_url,
            message="Presentation generated successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating presentation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/presentations/{presentation_id}/download")
async def download_presentation(
    presentation_id: UUID,
    token: str = Depends(verify_jwt_token),
    presentation_use_case: PresentationUseCase = Depends(get_presentation_use_case),
    storage_service: MinIOStorageService = Depends(get_storage_service)
):
    """
    Download presentation PPTX file
    
    Returns the PPTX file as a downloadable stream.
    """
    try:
        logger.info(f"Download request for presentation: {presentation_id}")
        
        # Get presentation
        presentation = presentation_use_case.get_presentation(presentation_id)
        if not presentation:
            logger.error(f"Presentation {presentation_id} not found")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")
        
        logger.info(f"Downloading from MinIO: {presentation.file_url}")
        
        # Download file from MinIO
        object_name = presentation.file_url
        pptx_data = storage_service.download_file(object_name)
        
        # Create streaming response
        safe_name = presentation.name.replace(' ', '_').replace('/', '_')
        filename = f"{safe_name}.pptx"
        
        logger.info(f"Sending file: {filename}, size: {len(pptx_data)} bytes")
        
        # Encode filename для поддержки кириллицы (RFC 5987)
        from urllib.parse import quote
        
        # ASCII fallback и UTF-8 encoded имя
        ascii_filename = "presentation.pptx"
        encoded_filename = quote(filename.encode('utf-8'))
        
        return StreamingResponse(
            io.BytesIO(pptx_data),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={
                "Content-Disposition": f'attachment; filename="{ascii_filename}"; filename*=UTF-8\'\'{encoded_filename}',
                "Content-Length": str(len(pptx_data)),
                "Cache-Control": "no-cache"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading presentation: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
