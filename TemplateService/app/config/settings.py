from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # MinIO
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET_NAME: str
    MINIO_SECURE: bool = False
    
    # JWT (для проверки токенов, если нужно)
    JWT_PUBLIC_KEY: str
    JWT_ISSUER: str
    JWT_AUDIENCE: str
    
    # Service
    SERVICE_NAME: str = "template-service"
    SERVICE_HOST: str = "template-service"
    SERVICE_PORT: int = 8003
    LOG_LEVEL: str = "INFO"
    
    # Consul
    CONSUL_ADDRESS: str = "consul:8500"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Получить настройки приложения (с кешированием)"""
    return Settings()


# Для обратной совместимости
settings = get_settings()
