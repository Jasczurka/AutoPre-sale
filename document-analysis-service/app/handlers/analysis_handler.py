import uuid
import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import AnalysisResult, BacklogItem, TKPItem
from app.services.minio_service import MinIOService
from app.services.mistral_service import MistralService
from app.services.mistral_service_tkp import MistralTKPService
from app.services.document_parser import DocumentParser
from app.services.kafka_service import KafkaService

logger = logging.getLogger(__name__)


class AnalysisHandler:
    def __init__(self, db: Session):
        self.db = db
        self.minio_service = MinIOService()
        self.mistral_service = MistralService()
        self.mistral_tkp_service = MistralTKPService()
        self.document_parser = DocumentParser()
        self.kafka_service = KafkaService()
    
    def process_file_uploaded(self, event: dict):
        """Обрабатывает событие FileUploaded"""
        project_id = event.get("project_id")
        file_url = event.get("file_url")  # URL файла в MinIO (например, "documents/project_123/tz.docx")
        
        if not project_id or not file_url:
            logger.error(f"Invalid event: missing project_id or file_url")
            return
        
        # Создаем запись анализа
        analysis = AnalysisResult(
            id=uuid.uuid4(),
            project_id=uuid.UUID(project_id),
            status="pending",
            started_at=datetime.utcnow()
        )
        self.db.add(analysis)
        self.db.commit()
        
        try:
            # Обновляем статус на in_progress
            analysis.status = "in_progress"
            self.db.commit()
            
            # Скачиваем файл из MinIO
            logger.info(f"Downloading file from MinIO: {file_url}")
            file_data = self.minio_service.download_file(file_url)
            
            # Извлекаем текст из файла
            logger.info("Extracting text from document")
            tz_text = self.document_parser.extract_text(file_data, file_url)
            
            # Получаем backlog от Mistral
            logger.info("Getting backlog from Mistral AI")
            backlog_response, conversation_id = self.mistral_service.get_backlog(tz_text)
            
            # Сохраняем backlog в БД и собираем список для события
            logger.info("Saving backlog to database")
            backlog_items_list = []
            if "backlog_table" in backlog_response:
                for item in backlog_response["backlog_table"]:
                    backlog_item = BacklogItem(
                        id=uuid.uuid4(),
                        analysis_id=analysis.id,
                        work_number=item.get("work_number", ""),
                        work_type=item.get("work_type", ""),
                        acceptance_criteria=item.get("acceptance_criteria")
                    )
                    self.db.add(backlog_item)
                    # Сохраняем объект для отправки в событии
                    backlog_items_list.append(backlog_item)
            
            self.db.commit()
            
            # Получаем ТКП от Mistral
            # В новых версиях SDK conversation_id не используется, передаем tz_text для контекста
            logger.info("Getting TKP from Mistral AI")
            tkp_response = self.mistral_tkp_service.get_tkp(conversation_id, tz_text)
            
            # Сохраняем ТКП в MinIO
            tkp_json = json.dumps(tkp_response, ensure_ascii=False, indent=2)
            tkp_object_name = f"tkp/{analysis.id}.json"
            tkp_url = self.minio_service.upload_file(
                tkp_object_name,
                tkp_json.encode('utf-8'),
                "application/json"
            )
            
            # Сохраняем ссылку на ТКП в БД
            tkp_item = TKPItem(
                id=uuid.uuid4(),
                analysis_id=analysis.id,
                url=tkp_url
            )
            self.db.add(tkp_item)
            
            # Обновляем статус на completed
            analysis.status = "completed"
            analysis.completed_at = datetime.utcnow()
            self.db.commit()
            
            logger.info(f"Found {len(backlog_items_list)} backlog items for analysis {analysis.id}")
            
            # Публикуем событие BacklogReady с данными backlog
            logger.info(f"Publishing BacklogReady event for project {project_id}")
            self.kafka_service.publish_backlog_ready(str(project_id), str(analysis.id), backlog_items_list)
            
            logger.info(f"Analysis completed successfully for project {project_id}")
            
        except Exception as e:
            logger.error(f"Error processing analysis: {e}", exc_info=True)
            analysis.status = "error"
            analysis.completed_at = datetime.utcnow()
            self.db.commit()
            raise

