import logging
from app.config.settings import settings
from app.config.database import SessionLocal
from app.handlers.analysis_handler import AnalysisHandler
from app.services.kafka_service import KafkaService

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def process_messages():
    """Основной цикл обработки сообщений из Kafka"""
    kafka_service = KafkaService()
    db = SessionLocal()
    
    try:
        logger.info(f"Starting to consume messages from topic: {settings.kafka_topic_file_uploaded}")
        
        handler = AnalysisHandler(db)
        
        for event in kafka_service.consume_file_uploaded():
            logger.info(f"Received FileUploaded event: {event}")
            try:
                handler.process_file_uploaded(event)
            except Exception as e:
                logger.error(f"Error processing event: {e}", exc_info=True)
                # Продолжаем обработку следующих сообщений
                continue
    
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
    finally:
        kafka_service.close()
        db.close()


if __name__ == "__main__":
    process_messages()

