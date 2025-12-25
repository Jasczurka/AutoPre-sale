"""Client for Template Service integration"""
import logging
from typing import Optional, Dict, Any
from uuid import UUID
import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)


class TemplateServiceClient:
    """Client for communicating with Template Service"""
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize Template Service client
        
        Args:
            base_url: Base URL of template service (optional, uses service discovery if not provided)
        """
        self.base_url = base_url or self._discover_service()
        self.timeout = 30.0
    
    def _discover_service(self) -> str:
        """
        Discover template service URL via Consul
        
        Returns:
            Service URL
        """
        try:
            import consul
            c = consul.Consul(host=settings.CONSUL_HOST, port=settings.CONSUL_PORT)
            _, services = c.health.service(settings.TEMPLATE_SERVICE_NAME, passing=True)
            
            if services:
                service = services[0]
                address = service['Service']['Address']
                port = service['Service']['Port']
                url = f"http://{address}:{port}"
                logger.info(f"Discovered template service at: {url}")
                return url
            else:
                logger.warning("Template service not found in Consul, using default")
                return "http://template-service:8003"
        except Exception as e:
            logger.error(f"Error discovering template service: {e}")
            return "http://template-service:8003"
    
    async def get_template_block(self, block_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get template block metadata
        
        Args:
            block_id: UUID of the template block
            
        Returns:
            Block metadata dictionary or None
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # TemplateService uses /api/Templates with capital T
                response = await client.get(f"{self.base_url}/api/Templates/{block_id}")
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Error fetching template block {block_id}: {e}")
            return None
    
    async def download_block_pptx(self, block_id: UUID) -> Optional[bytes]:
        """
        Download the PPTX file for a template block
        
        Args:
            block_id: UUID of the template block
            
        Returns:
            PPTX file data as bytes or None
        """
        try:
            # Download from MinIO via template service download endpoint
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # TemplateService uses /api/Templates with capital T
                response = await client.get(f"{self.base_url}/api/Templates/{block_id}/download")
                response.raise_for_status()
                logger.info(f"Successfully downloaded template block {block_id}, size: {len(response.content)} bytes")
                return response.content
                
        except httpx.HTTPError as e:
            logger.error(f"Error downloading block PPTX {block_id}: {e}")
            return None
    
    async def get_block_fields(self, block_id: UUID) -> list:
        """
        Get the list of fields (placeholders) for a block
        
        Args:
            block_id: UUID of the template block
            
        Returns:
            List of field definitions
        """
        block_data = await self.get_template_block(block_id)
        if block_data:
            return block_data.get("fields", [])
        return []
