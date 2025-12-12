import pytest
from unittest.mock import Mock, patch
from app.services.minio_service import MinIOService
from app.config.settings import Settings


@pytest.fixture
def mock_settings():
    """Мок настроек для тестирования"""
    settings = Mock(spec=Settings)
    settings.minio_endpoint = "localhost:9000"
    settings.minio_access_key = "test_key"
    settings.minio_secret_key = "test_secret"
    settings.minio_bucket_name = "test_bucket"
    settings.minio_secure = False
    return settings


@patch('app.services.minio_service.Minio')
def test_minio_service_initialization(mock_minio, mock_settings):
    """Тест инициализации MinIO сервиса"""
    with patch('app.services.minio_service.settings', mock_settings):
        service = MinIOService()
        assert service.client is not None


@patch('app.services.minio_service.Minio')
def test_ensure_bucket_exists(mock_minio, mock_settings):
    """Тест создания bucket если его нет"""
    mock_client = Mock()
    mock_client.bucket_exists.return_value = False
    mock_minio.return_value = mock_client
    
    with patch('app.services.minio_service.settings', mock_settings):
        service = MinIOService()
        service._ensure_bucket_exists()
        
        mock_client.make_bucket.assert_called_once_with("test_bucket")

