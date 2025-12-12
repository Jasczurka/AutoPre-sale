#!/usr/bin/env python3
"""
Скрипт для загрузки тестового файла ТЗ в MinIO
Использование: python scripts/upload_test_file_to_minio.py
"""
import sys
import os
from minio import Minio
from minio.error import S3Error

# Добавляем путь к корню проекта
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def upload_test_file(
    minio_endpoint: str = "localhost:9000",
    access_key: str = "minioadmin",
    secret_key: str = "minioadmin",
    bucket_name: str = "documents",
    object_name: str = None,
    file_content: str = None
):
    """Загружает тестовый файл ТЗ в MinIO"""
    
    if object_name is None:
        object_name = "test_project/tz.txt"
    
    if file_content is None:
        file_content = """ТЕХНИЧЕСКОЕ ЗАДАНИЕ

1. ОПИСАНИЕ ПРОЕКТА
Разработка системы управления проектами для автоматизации бизнес-процессов.

2. ЦЕЛИ ПРОЕКТА
- Автоматизация процессов управления проектами
- Повышение эффективности работы команды
- Сокращение времени на рутинные операции

3. ЗАДАЧИ ПРОЕКТА
- Разработать API для управления проектами
- Создать веб-интерфейс для пользователей
- Настроить систему уведомлений
- Обеспечить интеграцию с внешними системами

4. СОСТАВ И СОДЕРЖАНИЕ РАБОТ

Этап 1. Проектирование системы
- Анализ требований
- Проектирование архитектуры
- Создание технической документации

Этап 2. Разработка
- Разработка backend API
- Разработка frontend интерфейса
- Настройка базы данных

Этап 3. Тестирование и внедрение
- Проведение тестирования
- Развертывание системы
- Обучение пользователей

5. РЕЗУЛЬТАТЫ ПРОЕКТА
- Внедренная система управления проектами
- Документация по использованию системы
- Обученные пользователи

6. НЕФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ
- Производительность
- Безопасность
- Масштабируемость
- Надежность
"""
    
    print(f"Загрузка тестового файла в MinIO...")
    print(f"  Endpoint: {minio_endpoint}")
    print(f"  Bucket: {bucket_name}")
    print(f"  Object: {object_name}")
    
    try:
        client = Minio(
            minio_endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=False
        )
        
        # Создаем bucket если его нет
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            print(f"  ✅ Bucket '{bucket_name}' создан")
        
        # Загружаем файл
        from io import BytesIO
        data = BytesIO(file_content.encode('utf-8'))
        client.put_object(
            bucket_name,
            object_name,
            data,
            length=len(file_content.encode('utf-8')),
            content_type="text/plain"
        )
        
        print(f"  ✅ Файл успешно загружен!")
        print(f"  URL: http://{minio_endpoint}/{bucket_name}/{object_name}")
        
        return object_name
        
    except S3Error as e:
        print(f"  ❌ Ошибка MinIO: {e}")
        return None
    except Exception as e:
        print(f"  ❌ Неожиданная ошибка: {e}")
        return None


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Загрузка тестового файла ТЗ в MinIO")
    parser.add_argument(
        "--minio",
        default="localhost:9000",
        help="Адрес MinIO (по умолчанию: localhost:9000)"
    )
    parser.add_argument(
        "--access-key",
        default="minioadmin",
        help="Access key для MinIO (по умолчанию: minioadmin)"
    )
    parser.add_argument(
        "--secret-key",
        default="minioadmin",
        help="Secret key для MinIO (по умолчанию: minioadmin)"
    )
    parser.add_argument(
        "--bucket",
        default="documents",
        help="Название bucket (по умолчанию: documents)"
    )
    parser.add_argument(
        "--object-name",
        help="Имя объекта в MinIO (по умолчанию: test_project/tz.txt)"
    )
    
    args = parser.parse_args()
    
    result = upload_test_file(
        minio_endpoint=args.minio,
        access_key=args.access_key,
        secret_key=args.secret_key,
        bucket_name=args.bucket,
        object_name=args.object_name
    )
    
    sys.exit(0 if result else 1)

