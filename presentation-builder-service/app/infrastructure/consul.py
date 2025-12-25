"""Consul service discovery and registration"""
import logging
from typing import Optional
import consul

from app.config.settings import settings

logger = logging.getLogger(__name__)


class ConsulClient:
    """Client for Consul service discovery and registration"""
    
    def __init__(self):
        """Initialize Consul client"""
        self.consul = consul.Consul(
            host=settings.CONSUL_HOST,
            port=settings.CONSUL_PORT
        )
        self.service_id = settings.CONSUL_SERVICE_ID
        self.service_name = settings.SERVICE_NAME
    
    def register_service(self, host: str = "0.0.0.0", port: int = None):
        """
        Register service with Consul
        
        Args:
            host: Service host
            port: Service port
        """
        port = port or settings.SERVICE_PORT
        
        try:
            self.consul.agent.service.register(
                name=self.service_name,
                service_id=self.service_id,
                address=host,
                port=port,
                check=consul.Check.http(
                    f"http://{host}:{port}/health",
                    interval="10s",
                    timeout="5s",
                    deregister="30s"
                ),
                tags=["presentation", "builder", "pptx"]
            )
            logger.info(f"Service registered with Consul: {self.service_id}")
        except Exception as e:
            logger.error(f"Failed to register service with Consul: {e}")
    
    def deregister_service(self):
        """Deregister service from Consul"""
        try:
            self.consul.agent.service.deregister(self.service_id)
            logger.info(f"Service deregistered from Consul: {self.service_id}")
        except Exception as e:
            logger.error(f"Failed to deregister service from Consul: {e}")
    
    def discover_service(self, service_name: str) -> Optional[str]:
        """
        Discover a service by name
        
        Args:
            service_name: Name of the service to discover
            
        Returns:
            Service URL or None
        """
        try:
            _, services = self.consul.health.service(service_name, passing=True)
            
            if services:
                service = services[0]
                address = service['Service']['Address']
                port = service['Service']['Port']
                url = f"http://{address}:{port}"
                logger.info(f"Discovered service {service_name} at: {url}")
                return url
            else:
                logger.warning(f"Service {service_name} not found in Consul")
                return None
        except Exception as e:
            logger.error(f"Error discovering service {service_name}: {e}")
            return None
