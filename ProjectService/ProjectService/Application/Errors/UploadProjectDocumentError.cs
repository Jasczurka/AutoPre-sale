using ProjectService.Application.Common;

namespace ProjectService.Application.Errors;

public sealed record UploadProjectDocumentError(string Code, string Message) : IError
{
    public static readonly UploadProjectDocumentError ProjectNotFound =
        new("project.document.upload.project_not_found", "Проект не найден");

    public static readonly UploadProjectDocumentError InvalidFile =
        new("project.document.upload.invalid_file", "Недопустимый файл");

    public static readonly UploadProjectDocumentError UploadFailed =
        new("project.document.upload.failed", "Не удалось загрузить файл");

    public static readonly UploadProjectDocumentError DuplicateFile =
        new("project.document.upload.duplicate_file", "Файл с таким именем уже существует в проекте");
}
