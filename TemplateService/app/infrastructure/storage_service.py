from minio import Minio
from minio.error import S3Error
from io import BytesIO
from typing import BinaryIO
import logging

logger = logging.getLogger(__name__)


class MinIOStorageService:
    """Сервис для работы с MinIO хранилищем"""
    
    def __init__(self, endpoint: str, access_key: str, secret_key: str, bucket_name: str, secure: bool = False):
        self.endpoint = endpoint
        self.bucket_name = bucket_name
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Создает bucket если он не существует"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Bucket {self.bucket_name} created")
            else:
                logger.info(f"Bucket {self.bucket_name} already exists")
        except S3Error as e:
            logger.error(f"Error ensuring bucket exists: {e}")
            raise
    
    async def upload_file(self, file_data: BinaryIO, object_name: str, content_type: str) -> str:
        """
        Загружает файл в MinIO
        
        Args:
            file_data: Данные файла
            object_name: Имя объекта в MinIO (путь)
            content_type: MIME тип файла
            
        Returns:
            URL файла
        """
        try:
            # Читаем все данные в память для определения размера
            if hasattr(file_data, 'read'):
                data = file_data.read()
                if hasattr(file_data, 'seek'):
                    file_data.seek(0)
            else:
                data = file_data
            
            data_stream = BytesIO(data) if isinstance(data, bytes) else data
            file_size = len(data) if isinstance(data, bytes) else data_stream.getbuffer().nbytes
            
            self.client.put_object(
                self.bucket_name,
                object_name,
                data_stream,
                length=file_size,
                content_type=content_type
            )
            
            # Формируем URL
            url = f"http://{self.endpoint}/{self.bucket_name}/{object_name}"
            logger.info(f"File uploaded successfully: {url}")
            return url
            
        except S3Error as e:
            logger.error(f"Error uploading file to MinIO: {e}")
            raise
    
    async def delete_file(self, object_name: str) -> bool:
        """Удаляет файл из MinIO"""
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"File deleted: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting file from MinIO: {e}")
            return False
    
    async def get_file(self, object_name: str) -> bytes:
        """Получает файл из MinIO"""
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            logger.error(f"Error getting file from MinIO: {e}")
            raise
    
    def download_file(self, object_name: str) -> bytes:
        """Синхронная версия для скачивания файла из MinIO"""
        try:
            logger.info(f"Attempting to download: bucket={self.bucket_name}, object={object_name}")
            response = self.client.get_object(self.bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            logger.info(f"Successfully downloaded {len(data)} bytes from {object_name}")
            return data
        except S3Error as e:
            logger.error(f"S3Error downloading file from MinIO: bucket={self.bucket_name}, object={object_name}, error={e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error downloading file: {e}")
            raise
