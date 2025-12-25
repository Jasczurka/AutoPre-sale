"""Application settings and configuration"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings"""
    
    # Service Configuration
    SERVICE_NAME: str = Field(default="presentation-builder-service")
    SERVICE_PORT: int = Field(default=8005)
    SERVICE_HOST: str = Field(default="0.0.0.0")
    
    # Database Configuration
    DB_HOST: str = Field(default="postgres")
    DB_PORT: int = Field(default=5432)
    DB_USER: str = Field(default="postgres")
    DB_PASSWORD: str = Field(default="postgres")
    DB_NAME: str = Field(default="presentation_builder")
    
    # MinIO Configuration
    MINIO_ENDPOINT: str = Field(default="minio:9000")
    MINIO_ACCESS_KEY: str = Field(default="minioadmin")
    MINIO_SECRET_KEY: str = Field(default="minioadmin")
    MINIO_BUCKET_NAME: str = Field(default="presentations")
    MINIO_USE_SSL: bool = Field(default=False)
    
    # Consul Configuration
    CONSUL_HOST: str = Field(default="consul")
    CONSUL_PORT: int = Field(default=8500)
    CONSUL_DATACENTER: str = Field(default="dc1")
    CONSUL_SERVICE_ID: str = Field(default="presentation-builder-service-1")
    
    # JWT Configuration
    JWT_PUBLIC_KEY: str = Field(default="")
    JWT_ISSUER: str = Field(default="AuthService")
    JWT_AUDIENCE: str = Field(default="ApiClients")
    JWT_ALGORITHM: str = Field(default="RS256")
    
    # External Services
    TEMPLATE_SERVICE_NAME: str = Field(default="template-service")
    PROJECT_SERVICE_NAME: str = Field(default="project-service")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO")
    
    # Temporary files directory
    TEMP_DIR: str = Field(default="/tmp/pptx_work")
    
    @property
    def database_url(self) -> str:
        """Get database URL for SQLAlchemy"""
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def consul_address(self) -> str:
        """Get Consul address"""
        return f"{self.CONSUL_HOST}:{self.CONSUL_PORT}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
