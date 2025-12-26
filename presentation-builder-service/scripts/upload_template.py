#!/usr/bin/env python3
"""
Скрипт для загрузки мастер-шаблонов презентаций в MinIO

Использование:
    python upload_template.py path/to/template.pptx
    python upload_template.py path/to/template.pptx --name corporate
    python upload_template.py path/to/template.pptx --set-default
"""

import sys
import os
import argparse
from pathlib import Path
from minio import Minio
from minio.error import S3Error
from datetime import datetime
import hashlib


class TemplateUploader:
    """Загрузчик шаблонов в MinIO"""
    
    def __init__(
        self,
        endpoint: str = "localhost:9000",
        access_key: str = "minioadmin",
        secret_key: str = "minioadmin",
        bucket_name: str = "presentations",
        secure: bool = False
    ):
        """
        Инициализация клиента MinIO
        
        Args:
            endpoint: MinIO endpoint
            access_key: Access key
            secret_key: Secret key
            bucket_name: Имя bucket
            secure: Использовать HTTPS
        """
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
        self.bucket_name = bucket_name
        
    def ensure_bucket_exists(self):
        """Убедиться, что bucket существует"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"✅ Создан bucket: {self.bucket_name}")
            else:
                print(f"✅ Bucket существует: {self.bucket_name}")
        except S3Error as e:
            print(f"❌ Ошибка при проверке bucket: {e}")
            raise
    
    def upload_template(
        self,
        file_path: str,
        template_name: str = None,
        set_as_default: bool = False
    ) -> str:
        """
        Загрузить шаблон в MinIO
        
        Args:
            file_path: Путь к PPTX файлу
            template_name: Имя шаблона (если None, используется имя файла)
            set_as_default: Установить как шаблон по умолчанию
            
        Returns:
            Путь к файлу в MinIO
        """
        # Проверка файла
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл не найден: {file_path}")
        
        if not file_path.lower().endswith('.pptx'):
            raise ValueError("Файл должен быть в формате .pptx")
        
        # Получение информации о файле
        file_size = os.path.getsize(file_path)
        file_size_mb = file_size / (1024 * 1024)
        
        print("\n" + "="*70)
        print("📤 ЗАГРУЗКА МАСТЕР-ШАБЛОНА")
        print("="*70)
        print(f"📄 Файл: {os.path.basename(file_path)}")
        print(f"📊 Размер: {file_size_mb:.2f} MB")
        
        # Определение имени шаблона
        if template_name is None:
            template_name = Path(file_path).stem
        
        # Определение пути в MinIO
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        object_name = f"templates/master/{template_name}_{timestamp}.pptx"
        
        if set_as_default:
            # Если устанавливаем как default, используем фиксированное имя
            object_name = "templates/master/default.pptx"
        
        print(f"🔗 Путь в MinIO: {object_name}")
        
        # Загрузка файла
        try:
            print(f"⏳ Загрузка...")
            self.client.fput_object(
                self.bucket_name,
                object_name,
                file_path,
                content_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
            print(f"✅ Файл успешно загружен!")
            
            # Вычисление хеша для проверки
            with open(file_path, 'rb') as f:
                file_hash = hashlib.md5(f.read()).hexdigest()
            
            print("\n" + "="*70)
            print("✅ ЗАГРУЗКА ЗАВЕРШЕНА")
            print("="*70)
            print(f"📁 Bucket:      {self.bucket_name}")
            print(f"📄 Object:      {object_name}")
            print(f"🔑 MD5 Hash:    {file_hash}")
            print(f"📏 Size:        {file_size_mb:.2f} MB")
            
            if set_as_default:
                print("\n⚠️  ВАЖНО: Этот шаблон установлен как default!")
                print("   Добавьте в .env файл presentation-builder-service:")
                print(f"   MASTER_TEMPLATE_URL={object_name}")
            else:
                print("\n📝 Для использования этого шаблона:")
                print("   1. Как шаблон по умолчанию:")
                print(f"      MASTER_TEMPLATE_URL={object_name}")
                print("   2. Как опциональный шаблон при создании презентации:")
                print(f"      template_url=\"{object_name}\"")
            
            print("="*70 + "\n")
            
            return object_name
            
        except S3Error as e:
            print(f"❌ Ошибка при загрузке: {e}")
            raise
    
    def list_templates(self):
        """Показать все загруженные шаблоны"""
        print("\n" + "="*70)
        print("📋 СПИСОК МАСТЕР-ШАБЛОНОВ")
        print("="*70)
        
        try:
            objects = self.client.list_objects(
                self.bucket_name,
                prefix="templates/master/",
                recursive=True
            )
            
            templates = []
            for obj in objects:
                if obj.object_name.endswith('.pptx'):
                    templates.append({
                        'name': obj.object_name,
                        'size': obj.size / (1024 * 1024),
                        'modified': obj.last_modified
                    })
            
            if not templates:
                print("📭 Шаблоны не найдены")
            else:
                print(f"\n🔍 Найдено шаблонов: {len(templates)}\n")
                for i, tmpl in enumerate(templates, 1):
                    is_default = "templates/master/default.pptx" in tmpl['name']
                    default_marker = " [DEFAULT]" if is_default else ""
                    print(f"{i}. {tmpl['name']}{default_marker}")
                    print(f"   📊 Размер: {tmpl['size']:.2f} MB")
                    print(f"   📅 Изменен: {tmpl['modified']}")
                    print()
            
            print("="*70 + "\n")
            
        except S3Error as e:
            print(f"❌ Ошибка при получении списка: {e}")
    
    def delete_template(self, object_name: str):
        """Удалить шаблон"""
        print(f"\n⚠️  Удаление шаблона: {object_name}")
        
        try:
            self.client.remove_object(self.bucket_name, object_name)
            print(f"✅ Шаблон удален: {object_name}\n")
        except S3Error as e:
            print(f"❌ Ошибка при удалении: {e}")
            raise


def main():
    """Основная функция"""
    parser = argparse.ArgumentParser(
        description="Загрузка мастер-шаблонов презентаций в MinIO",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры использования:

  # Загрузить шаблон
  python upload_template.py my_template.pptx
  
  # Загрузить с кастомным именем
  python upload_template.py my_template.pptx --name corporate_v2
  
  # Установить как шаблон по умолчанию
  python upload_template.py my_template.pptx --set-default
  
  # Показать все шаблоны
  python upload_template.py --list
  
  # Удалить шаблон
  python upload_template.py --delete templates/master/old_template.pptx

Переменные окружения:
  MINIO_ENDPOINT     - MinIO endpoint (по умолчанию: localhost:9000)
  MINIO_ACCESS_KEY   - Access key (по умолчанию: minioadmin)
  MINIO_SECRET_KEY   - Secret key (по умолчанию: minioadmin)
  MINIO_BUCKET_NAME  - Bucket name (по умолчанию: presentations)
  MINIO_USE_SSL      - Использовать SSL (по умолчанию: false)
        """
    )
    
    parser.add_argument(
        'file',
        nargs='?',
        help='Путь к PPTX файлу шаблона'
    )
    
    parser.add_argument(
        '--name',
        help='Имя шаблона (если не указано, используется имя файла)'
    )
    
    parser.add_argument(
        '--set-default',
        action='store_true',
        help='Установить как шаблон по умолчанию (default.pptx)'
    )
    
    parser.add_argument(
        '--list',
        action='store_true',
        help='Показать список всех шаблонов'
    )
    
    parser.add_argument(
        '--delete',
        metavar='OBJECT_NAME',
        help='Удалить шаблон по его пути в MinIO'
    )
    
    parser.add_argument(
        '--endpoint',
        default=os.getenv('MINIO_ENDPOINT', 'localhost:9000'),
        help='MinIO endpoint'
    )
    
    parser.add_argument(
        '--access-key',
        default=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
        help='MinIO access key'
    )
    
    parser.add_argument(
        '--secret-key',
        default=os.getenv('MINIO_SECRET_KEY', 'minioadmin'),
        help='MinIO secret key'
    )
    
    parser.add_argument(
        '--bucket',
        default=os.getenv('MINIO_BUCKET_NAME', 'presentations'),
        help='MinIO bucket name'
    )
    
    parser.add_argument(
        '--ssl',
        action='store_true',
        default=os.getenv('MINIO_USE_SSL', 'false').lower() == 'true',
        help='Использовать SSL'
    )
    
    args = parser.parse_args()
    
    # Создание uploader
    uploader = TemplateUploader(
        endpoint=args.endpoint,
        access_key=args.access_key,
        secret_key=args.secret_key,
        bucket_name=args.bucket,
        secure=args.ssl
    )
    
    # Убедиться, что bucket существует
    uploader.ensure_bucket_exists()
    
    # Выполнение команд
    if args.list:
        uploader.list_templates()
    elif args.delete:
        uploader.delete_template(args.delete)
    elif args.file:
        uploader.upload_template(
            args.file,
            template_name=args.name,
            set_as_default=args.set_default
        )
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
