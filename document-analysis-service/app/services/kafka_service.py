from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import KafkaError
import json
import logging
from app.config.settings import settings

logger = logging.getLogger(__name__)


class KafkaService:
    def __init__(self):
        self.consumer = KafkaConsumer(
            settings.kafka_topic_file_uploaded,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=settings.kafka_consumer_group,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='earliest',
            enable_auto_commit=True
        )
        
        self.producer = KafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
    
    def consume_file_uploaded(self):
        """Потребляет события FileUploaded (генератор)"""
        try:
            for message in self.consumer:
                logger.info(f"Received message from topic {message.topic}, partition {message.partition}, offset {message.offset}")
                yield message.value
        except KafkaError as e:
            logger.error(f"Kafka consumer error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in consumer: {e}")
            raise
    
    def publish_backlog_ready(self, project_id: str, analysis_id: str):
        """Публикует событие BacklogReady"""
        try:
            event = {
                "project_id": project_id,
                "analysis_id": analysis_id,
                "status": "completed"
            }
            self.producer.send(settings.kafka_topic_backlog_ready, value=event)
            self.producer.flush()
            logger.info(f"Published BacklogReady event for project {project_id}")
        except KafkaError as e:
            logger.error(f"Kafka producer error: {e}")
            raise
    
    def close(self):
        """Закрывает соединения"""
        self.consumer.close()
        self.producer.close()

