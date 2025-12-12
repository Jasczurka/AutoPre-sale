from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str
    
    # Kafka
    kafka_bootstrap_servers: str
    kafka_consumer_group: str
    kafka_topic_file_uploaded: str
    kafka_topic_backlog_ready: str
    
    # MinIO
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_bucket_name: str
    minio_secure: bool = False
    
    # Mistral AI
    mistral_api_key: str
    mistral_agent_id: str
    mistral_agent_tkp_id: str
    
    # Service
    service_name: str = "document-analysis-service"
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


