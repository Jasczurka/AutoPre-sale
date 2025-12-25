"""MinIO storage service for PPTX files"""
import io
import logging
from typing import BinaryIO, Optional
from uuid import UUID
from minio import Minio
from minio.error import S3Error

from app.config.settings import settings

logger = logging.getLogger(__name__)


class MinIOStorageService:
    """Service for managing PPTX files in MinIO"""
    
    def __init__(self):
        """Initialize MinIO client"""
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, create if it doesn't"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
            else:
                logger.info(f"Bucket already exists: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Error ensuring bucket exists: {e}")
            raise
    
    def upload_file(self, file_data: BinaryIO, object_name: str, content_type: str = "application/vnd.openxmlformats-officedocument.presentationml.presentation") -> str:
        """
        Upload a file to MinIO
        
        Args:
            file_data: File data as BinaryIO
            object_name: Name of the object in MinIO
            content_type: MIME type of the file
            
        Returns:
            URL of the uploaded file
        """
        try:
            # Get file size
            file_data.seek(0, 2)  # Seek to end
            file_size = file_data.tell()
            file_data.seek(0)  # Seek back to start
            
            self.client.put_object(
                self.bucket_name,
                object_name,
                file_data,
                file_size,
                content_type=content_type
            )
            
            logger.info(f"Uploaded file to bucket {self.bucket_name}: {object_name}")
            return object_name  # Return just the object_name, not bucket/object_name
            
        except S3Error as e:
            logger.error(f"Error uploading file: {e}")
            raise
    
    def download_file(self, object_name: str) -> bytes:
        """
        Download a file from MinIO
        
        Args:
            object_name: Name of the object in MinIO
            
        Returns:
            File data as bytes
        """
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            logger.info(f"Downloaded file: {object_name}")
            return data
        except S3Error as e:
            logger.error(f"Error downloading file: {e}")
            raise
    
    def delete_file(self, object_name: str) -> bool:
        """
        Delete a file from MinIO
        
        Args:
            object_name: Name of the object in MinIO
            
        Returns:
            True if successful
        """
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"Deleted file: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting file: {e}")
            return False
    
    def file_exists(self, object_name: str) -> bool:
        """
        Check if a file exists in MinIO
        
        Args:
            object_name: Name of the object in MinIO
            
        Returns:
            True if file exists
        """
        try:
            self.client.stat_object(self.bucket_name, object_name)
            return True
        except S3Error:
            return False
    
    def get_file_url(self, object_name: str) -> str:
        """
        Get the URL for accessing a file
        
        Args:
            object_name: Name of the object in MinIO
            
        Returns:
            URL string
        """
        return f"{self.bucket_name}/{object_name}"
