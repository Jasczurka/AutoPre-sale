"""Client for Project Service integration"""
import logging
from typing import Optional, Dict, Any
from uuid import UUID
import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)


class ProjectServiceClient:
    """Client for communicating with Project Service"""
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize Project Service client
        
        Args:
            base_url: Base URL of project service (optional, uses service discovery if not provided)
        """
        self.base_url = base_url or self._discover_service()
        self.timeout = 30.0
    
    def _discover_service(self) -> str:
        """
        Discover project service URL via Consul
        
        Returns:
            Service URL
        """
        try:
            import consul
            c = consul.Consul(host=settings.CONSUL_HOST, port=settings.CONSUL_PORT)
            _, services = c.health.service(settings.PROJECT_SERVICE_NAME, passing=True)
            
            if services:
                service = services[0]
                address = service['Service']['Address']
                port = service['Service']['Port']
                url = f"http://{address}:{port}"
                logger.info(f"Discovered project service at: {url}")
                return url
            else:
                logger.warning("Project service not found in Consul, using default")
                return "http://project-service:8080"
        except Exception as e:
            logger.error(f"Error discovering project service: {e}")
            return "http://project-service:8080"
    
    async def get_project(self, project_id: UUID, auth_token: str) -> Optional[Dict[str, Any]]:
        """
        Get project by ID
        
        Args:
            project_id: UUID of the project
            auth_token: JWT authentication token
            
        Returns:
            Project data dictionary or None
        """
        try:
            headers = {"Authorization": f"Bearer {auth_token}"}
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/api/projects/{project_id}",
                    headers=headers
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Error fetching project {project_id}: {e}")
            return None
    
    async def check_project_exists(self, project_id: UUID, auth_token: str) -> bool:
        """
        Check if a project exists
        
        Args:
            project_id: UUID of the project
            auth_token: JWT authentication token
            
        Returns:
            True if project exists
        """
        project = await self.get_project(project_id, auth_token)
        return project is not None
