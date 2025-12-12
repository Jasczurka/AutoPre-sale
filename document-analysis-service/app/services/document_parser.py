import logging
from typing import Optional

logger = logging.getLogger(__name__)


class DocumentParser:
    """Парсер для извлечения текста из различных форматов документов"""
    
    @staticmethod
    def extract_text(file_data: bytes, file_name: str) -> str:
        """Извлекает текст из файла"""
        file_ext = file_name.split('.')[-1].lower()
        
        if file_ext == 'txt':
            return file_data.decode('utf-8')
        elif file_ext == 'docx':
            return DocumentParser._extract_from_docx(file_data)
        elif file_ext == 'pdf':
            return DocumentParser._extract_from_pdf(file_data)
        else:
            # По умолчанию пытаемся декодировать как текст
            try:
                return file_data.decode('utf-8')
            except UnicodeDecodeError:
                logger.warning(f"Could not decode file {file_name}, trying latin-1")
                return file_data.decode('latin-1')
    
    @staticmethod
    def _extract_from_docx(file_data: bytes) -> str:
        """Извлекает текст из DOCX"""
        try:
            from docx import Document
            import io
            doc = Document(io.BytesIO(file_data))
            return '\n'.join([paragraph.text for paragraph in doc.paragraphs])
        except ImportError:
            logger.warning("python-docx not installed, trying plain text extraction")
            return file_data.decode('utf-8', errors='ignore')
        except Exception as e:
            logger.error(f"Error extracting from DOCX: {e}")
            return file_data.decode('utf-8', errors='ignore')
    
    @staticmethod
    def _extract_from_pdf(file_data: bytes) -> str:
        """Извлекает текст из PDF"""
        try:
            import PyPDF2
            import io
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_data))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except ImportError:
            logger.warning("PyPDF2 not installed, trying plain text extraction")
            return file_data.decode('utf-8', errors='ignore')
        except Exception as e:
            logger.error(f"Error extracting from PDF: {e}")
            return file_data.decode('utf-8', errors='ignore')


