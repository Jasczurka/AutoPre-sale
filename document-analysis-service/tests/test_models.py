import pytest
from uuid import uuid4
from datetime import datetime
from app.models.models import AnalysisResult, BacklogItem, TKPItem


def test_analysis_result_creation():
    """Тест создания записи анализа"""
    analysis = AnalysisResult(
        id=uuid4(),
        project_id=uuid4(),
        status="pending",
        started_at=datetime.utcnow()
    )
    
    assert analysis.status == "pending"
    assert analysis.completed_at is None


def test_backlog_item_creation():
    """Тест создания элемента бэклога"""
    analysis_id = uuid4()
    backlog_item = BacklogItem(
        id=uuid4(),
        analysis_id=analysis_id,
        work_number="1.1",
        work_type="Разработка API",
        acceptance_criteria="API работает корректно"
    )
    
    assert backlog_item.work_number == "1.1"
    assert backlog_item.work_type == "Разработка API"
    assert backlog_item.analysis_id == analysis_id


def test_tkp_item_creation():
    """Тест создания записи ТКП"""
    analysis_id = uuid4()
    tkp_item = TKPItem(
        id=uuid4(),
        analysis_id=analysis_id,
        url="http://minio:9000/documents/tkp/123.json"
    )
    
    assert tkp_item.url.startswith("http://")
    assert tkp_item.analysis_id == analysis_id

