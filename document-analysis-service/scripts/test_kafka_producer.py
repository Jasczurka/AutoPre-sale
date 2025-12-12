#!/usr/bin/env python3
"""
Скрипт для отправки тестового события FileUploaded в Kafka
Использование: python scripts/test_kafka_producer.py
"""
import json
import sys
import os
from uuid import uuid4
from kafka import KafkaProducer
from kafka.errors import KafkaError

# Добавляем путь к корню проекта
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def send_test_file_uploaded_event(
    kafka_bootstrap_servers: str = "localhost:9092",
    topic: str = "file-uploaded",
    project_id: str = None,
    file_url: str = None
):
    """Отправляет тестовое событие FileUploaded в Kafka"""
    
    if project_id is None:
        project_id = str(uuid4())
    
    if file_url is None:
        # Пример пути к файлу в MinIO
        file_url = f"documents/project_{project_id}/tz.txt"
    
    event = {
        "project_id": project_id,
        "file_url": file_url
    }
    
    print(f"Отправка события FileUploaded в Kafka...")
    print(f"  Topic: {topic}")
    print(f"  Project ID: {project_id}")
    print(f"  File URL: {file_url}")
    print(f"  Event: {json.dumps(event, indent=2)}")
    
    try:
        producer = KafkaProducer(
            bootstrap_servers=kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        
        future = producer.send(topic, value=event)
        record_metadata = future.get(timeout=10)
        
        print(f"\n✅ Событие успешно отправлено!")
        print(f"  Partition: {record_metadata.partition}")
        print(f"  Offset: {record_metadata.offset}")
        
        producer.flush()
        producer.close()
        
        return True
        
    except KafkaError as e:
        print(f"\n❌ Ошибка при отправке события: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {e}")
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Отправка тестового события FileUploaded в Kafka")
    parser.add_argument(
        "--kafka",
        default="localhost:9092",
        help="Адрес Kafka брокера (по умолчанию: localhost:9092)"
    )
    parser.add_argument(
        "--topic",
        default="file-uploaded",
        help="Название топика (по умолчанию: file-uploaded)"
    )
    parser.add_argument(
        "--project-id",
        help="ID проекта (по умолчанию: генерируется автоматически)"
    )
    parser.add_argument(
        "--file-url",
        help="URL файла в MinIO (по умолчанию: генерируется автоматически)"
    )
    
    args = parser.parse_args()
    
    success = send_test_file_uploaded_event(
        kafka_bootstrap_servers=args.kafka,
        topic=args.topic,
        project_id=args.project_id,
        file_url=args.file_url
    )
    
    sys.exit(0 if success else 1)

