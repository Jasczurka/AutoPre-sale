"""PPTX manipulation service using python-pptx"""
import io
import os
import logging
import tempfile
from typing import Dict, List, Optional, BinaryIO
from uuid import UUID
from pptx import Presentation as PPTXPresentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE_TYPE

logger = logging.getLogger(__name__)


class PPTXService:
    """Service for creating and manipulating PPTX files"""
    
    @staticmethod
    def create_empty_presentation() -> bytes:
        """
        Create an empty PPTX presentation with one blank slide
        
        Returns:
            PPTX file as bytes
        """
        prs = PPTXPresentation()
        # Add a blank slide
        blank_slide_layout = prs.slide_layouts[6]  # Blank layout
        prs.slides.add_slide(blank_slide_layout)
        
        # Save to bytes
        output = io.BytesIO()
        prs.save(output)
        output.seek(0)
        return output.read()
    
    @staticmethod
    def load_presentation(pptx_data: bytes) -> PPTXPresentation:
        """
        Load a PPTX presentation from bytes
        
        Args:
            pptx_data: PPTX file data as bytes
            
        Returns:
            Presentation object
        """
        input_stream = io.BytesIO(pptx_data)
        return PPTXPresentation(input_stream)
    
    @staticmethod
    def save_presentation(prs: PPTXPresentation) -> bytes:
        """
        Save a PPTX presentation to bytes
        
        Args:
            prs: Presentation object
            
        Returns:
            PPTX file as bytes
        """
        output = io.BytesIO()
        prs.save(output)
        output.seek(0)
        return output.read()
    
    @staticmethod
    def add_slide(prs: PPTXPresentation, layout_index: int = 6) -> int:
        """
        Add a new slide to the presentation
        
        Args:
            prs: Presentation object
            layout_index: Index of slide layout (6 = blank)
            
        Returns:
            Index of the new slide
        """
        slide_layout = prs.slide_layouts[layout_index]
        prs.slides.add_slide(slide_layout)
        return len(prs.slides) - 1
    
    @staticmethod
    def copy_shapes_from_block(
        target_prs: PPTXPresentation,
        block_pptx_data: bytes,
        slide_index: int
    ) -> bool:
        """
        Copy all shapes from a block PPTX to a target presentation slide
        
        Args:
            target_prs: Target presentation
            block_pptx_data: Block PPTX file data
            slide_index: Target slide index
            
        Returns:
            True if successful
        """
        try:
            # Load block presentation
            block_prs = PPTXService.load_presentation(block_pptx_data)
            
            # Get first slide from block (blocks are single-slide templates)
            if len(block_prs.slides) == 0:
                logger.warning("Block has no slides")
                return False
            
            source_slide = block_prs.slides[0]
            target_slide = target_prs.slides[slide_index]
            
            # Copy all shapes from source to target
            for shape in source_slide.shapes:
                PPTXService._copy_shape(shape, target_slide)
            
            logger.info(f"Copied {len(source_slide.shapes)} shapes to slide {slide_index}")
            return True
            
        except Exception as e:
            logger.error(f"Error copying shapes from block: {e}")
            return False
    
    @staticmethod
    def _copy_shape(source_shape, target_slide):
        """
        Copy a single shape to target slide
        
        Note: This is a simplified implementation. 
        For production, consider using more sophisticated shape cloning.
        """
        try:
            # Handle different shape types
            if source_shape.shape_type == MSO_SHAPE_TYPE.TEXT_BOX:
                # Copy text box
                textbox = target_slide.shapes.add_textbox(
                    source_shape.left,
                    source_shape.top,
                    source_shape.width,
                    source_shape.height
                )
                if source_shape.has_text_frame:
                    textbox.text_frame.text = source_shape.text_frame.text
                    # Copy text formatting
                    for src_para, tgt_para in zip(source_shape.text_frame.paragraphs, textbox.text_frame.paragraphs):
                        tgt_para.alignment = src_para.alignment
                        for src_run, tgt_run in zip(src_para.runs, tgt_para.runs):
                            tgt_run.font.size = src_run.font.size
                            tgt_run.font.bold = src_run.font.bold
                            tgt_run.font.italic = src_run.font.italic
                            if src_run.font.color.rgb:
                                tgt_run.font.color.rgb = src_run.font.color.rgb
            
            elif source_shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                # Copy picture
                image_stream = io.BytesIO(source_shape.image.blob)
                target_slide.shapes.add_picture(
                    image_stream,
                    source_shape.left,
                    source_shape.top,
                    source_shape.width,
                    source_shape.height
                )
            
            elif source_shape.shape_type == MSO_SHAPE_TYPE.AUTO_SHAPE:
                # Copy auto shape
                shape = target_slide.shapes.add_shape(
                    source_shape.auto_shape_type,
                    source_shape.left,
                    source_shape.top,
                    source_shape.width,
                    source_shape.height
                )
                if source_shape.has_text_frame and shape.has_text_frame:
                    shape.text_frame.text = source_shape.text_frame.text
            
            elif source_shape.shape_type == MSO_SHAPE_TYPE.TABLE:
                # Copy table
                table = target_slide.shapes.add_table(
                    len(source_shape.table.rows),
                    len(source_shape.table.columns),
                    source_shape.left,
                    source_shape.top,
                    source_shape.width,
                    source_shape.height
                ).table
                
                # Copy cell contents
                for row_idx, row in enumerate(source_shape.table.rows):
                    for col_idx, cell in enumerate(row.cells):
                        target_cell = table.cell(row_idx, col_idx)
                        target_cell.text = cell.text
            
            else:
                logger.warning(f"Unsupported shape type: {source_shape.shape_type}")
                
        except Exception as e:
            logger.error(f"Error copying shape: {e}")
    
    @staticmethod
    def replace_placeholders(
        prs: PPTXPresentation,
        slide_index: int,
        replacements: Dict[str, str]
    ) -> bool:
        """
        Replace placeholders in a slide with actual values
        
        Args:
            prs: Presentation object
            slide_index: Index of slide to modify
            replacements: Dictionary of {placeholder: value}
            
        Returns:
            True if successful
        """
        try:
            slide = prs.slides[slide_index]
            
            for shape in slide.shapes:
                if shape.has_text_frame:
                    text_frame = shape.text_frame
                    # Check each paragraph
                    for paragraph in text_frame.paragraphs:
                        for run in paragraph.runs:
                            # Replace placeholders
                            for placeholder, value in replacements.items():
                                placeholder_text = f"{{{{{placeholder}}}}}"
                                if placeholder_text in run.text:
                                    run.text = run.text.replace(placeholder_text, str(value))
                                    logger.info(f"Replaced {placeholder_text} with {value}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error replacing placeholders: {e}")
            return False
    
    @staticmethod
    def get_slide_count(prs: PPTXPresentation) -> int:
        """Get number of slides in presentation"""
        return len(prs.slides)
