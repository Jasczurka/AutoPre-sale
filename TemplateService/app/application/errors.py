from typing import Optional


class ApplicationError(Exception):
    """Базовый класс для ошибок приложения"""
    
    def __init__(self, message: str, code: str, details: Optional[dict] = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ImportTemplateError(ApplicationError):
    """Ошибки импорта шаблона"""
    
    @staticmethod
    def invalid_file():
        return ImportTemplateError(
            "Невалидный файл или формат не поддерживается",
            "import.invalid_file"
        )
    
    @staticmethod
    def upload_failed(details: str = ""):
        return ImportTemplateError(
            "Ошибка загрузки файла в хранилище",
            "import.upload_failed",
            {"details": details}
        )
    
    @staticmethod
    def parse_failed(details: str = ""):
        return ImportTemplateError(
            "Ошибка парсинга PPTX файла",
            "import.parse_failed",
            {"details": details}
        )
    
    @staticmethod
    def database_error(details: str = ""):
        return ImportTemplateError(
            "Ошибка сохранения в базу данных",
            "import.database_error",
            {"details": details}
        )


class GetTemplateError(ApplicationError):
    """Ошибки получения шаблонов"""
    
    @staticmethod
    def not_found():
        return GetTemplateError(
            "Шаблон не найден",
            "template.not_found"
        )
    
    @staticmethod
    def validation_error(details: str = ""):
        return GetTemplateError(
            "Ошибка валидации данных",
            "template.validation_error",
            {"details": details}
        )
    
    @staticmethod
    def database_error(details: str = ""):
        return GetTemplateError(
            "Ошибка получения данных",
            "template.database_error",
            {"details": details}
        )


class DeleteTemplateError(ApplicationError):
    """Ошибки удаления шаблонов"""
    
    @staticmethod
    def not_found():
        return DeleteTemplateError(
            "Файл шаблона не найден",
            "template.not_found"
        )
    
    @staticmethod
    def database_error(details: str = ""):
        return DeleteTemplateError(
            "Ошибка удаления",
            "template.database_error",
            {"details": details}
        )
