import pytest
from app.services.document_parser import DocumentParser


def test_extract_text_from_txt():
    """Тест извлечения текста из TXT файла"""
    parser = DocumentParser()
    text_data = b"Test document content\nLine 2"
    result = parser.extract_text(text_data, "test.txt")
    
    assert "Test document content" in result
    assert "Line 2" in result


def test_extract_text_from_unknown_format():
    """Тест извлечения текста из неизвестного формата (fallback на UTF-8)"""
    parser = DocumentParser()
    text_data = "Тестовый документ".encode('utf-8')
    result = parser.extract_text(text_data, "test.unknown")
    
    assert "Тестовый документ" in result

