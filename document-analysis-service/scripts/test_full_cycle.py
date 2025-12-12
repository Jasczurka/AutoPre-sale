#!/usr/bin/env python3
"""
Полный цикл тестирования: загрузка файла в MinIO -> отправка события в Kafka -> проверка результатов
Использование: python scripts/test_full_cycle.py
"""
import sys
import os
import time
import json
from uuid import uuid4
from datetime import datetime

# Добавляем путь к корню проекта
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.upload_test_file_to_minio import upload_test_file
from scripts.test_kafka_producer import send_test_file_uploaded_event


def test_full_cycle(
    minio_endpoint: str = "localhost:9000",
    kafka_bootstrap_servers: str = "localhost:9092",
    project_id: str = None
):
    """Выполняет полный цикл тестирования"""
    
    if project_id is None:
        project_id = str(uuid4())
    
    print("=" * 60)
    print("ТЕСТИРОВАНИЕ ПОЛНОГО ЦИКЛА DOCUMENT-ANALYSIS-SERVICE")
    print("=" * 60)
    print(f"Project ID: {project_id}")
    print(f"Время начала: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Шаг 1: Загрузка тестового файла в MinIO
    print("ШАГ 1: Загрузка тестового файла ТЗ в MinIO")
    print("-" * 60)
    file_url = upload_test_file(
        minio_endpoint=minio_endpoint,
        object_name=f"test_project_{project_id}/tz.txt"
    )
    
    if not file_url:
        print("❌ Ошибка при загрузке файла в MinIO")
        return False
    
    print()
    time.sleep(2)  # Небольшая задержка
    
    # Шаг 2: Отправка события в Kafka
    print("ШАГ 2: Отправка события FileUploaded в Kafka")
    print("-" * 60)
    success = send_test_file_uploaded_event(
        kafka_bootstrap_servers=kafka_bootstrap_servers,
        project_id=project_id,
        file_url=file_url
    )
    
    if not success:
        print("❌ Ошибка при отправке события в Kafka")
        return False
    
    print()
    print("=" * 60)
    print("✅ ТЕСТИРОВАНИЕ ЗАПУЩЕНО")
    print("=" * 60)
    print()
    print("Следующие шаги:")
    print("1. Проверьте логи document-analysis-service:")
    print("   docker logs -f document-analysis-service")
    print()
    print("2. Проверьте результаты в базе данных:")
    print("   docker exec -it postgres-document-analysis psql -U postgres -d document_analysis_db")
    print("   SELECT * FROM analysis_results WHERE project_id = '{}';".format(project_id))
    print("   SELECT * FROM backlog_table WHERE analysis_id IN (SELECT id FROM analysis_results WHERE project_id = '{}');".format(project_id))
    print()
    print("3. Проверьте наличие файла ТКП в MinIO:")
    print("   Откройте MinIO Console: http://localhost:9001")
    print("   Или проверьте через API")
    print()
    print("4. Проверьте событие BacklogReady в Kafka:")
    print("   docker exec -it kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic backlog-ready --from-beginning")
    print()
    
    return True


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Полный цикл тестирования document-analysis-service")
    parser.add_argument(
        "--minio",
        default="localhost:9000",
        help="Адрес MinIO (по умолчанию: localhost:9000)"
    )
    parser.add_argument(
        "--kafka",
        default="localhost:9092",
        help="Адрес Kafka (по умолчанию: localhost:9092)"
    )
    parser.add_argument(
        "--project-id",
        help="ID проекта (по умолчанию: генерируется автоматически)"
    )
    
    args = parser.parse_args()
    
    success = test_full_cycle(
        minio_endpoint=args.minio,
        kafka_bootstrap_servers=args.kafka,
        project_id=args.project_id
    )
    
    sys.exit(0 if success else 1)

