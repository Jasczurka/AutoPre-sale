from minio import Minio
from minio.error import S3Error
from app.config.settings import settings
import io
import logging

logger = logging.getLogger(__name__)


class MinIOService:
    def __init__(self):
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure
        )
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Создает bucket, если его нет"""
        try:
            if not self.client.bucket_exists(settings.minio_bucket_name):
                self.client.make_bucket(settings.minio_bucket_name)
                logger.info(f"Bucket {settings.minio_bucket_name} created")
        except S3Error as e:
            logger.error(f"Error ensuring bucket exists: {e}")
            raise
    
    def download_file(self, object_name: str) -> bytes:
        """Скачивает файл из MinIO"""
        try:
            response = self.client.get_object(settings.minio_bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            logger.error(f"Error downloading file {object_name}: {e}")
            raise
    
    def upload_file(self, object_name: str, data: bytes, content_type: str = "application/json"):
        """Загружает файл в MinIO"""
        try:
            data_stream = io.BytesIO(data)
            self.client.put_object(
                settings.minio_bucket_name,
                object_name,
                data_stream,
                length=len(data),
                content_type=content_type
            )
            # Формируем URL для доступа к файлу
            url = f"http://{settings.minio_endpoint}/{settings.minio_bucket_name}/{object_name}"
            logger.info(f"File uploaded: {url}")
            return url
        except S3Error as e:
            logger.error(f"Error uploading file {object_name}: {e}")
            raise
    
    def get_file_url(self, object_name: str) -> str:
        """Возвращает URL файла в MinIO"""
        return f"http://{settings.minio_endpoint}/{settings.minio_bucket_name}/{object_name}"


