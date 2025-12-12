using BacklogService.Application.Common;

namespace BacklogService.Application.Errors;

public sealed record ExportBacklogError(string Code, string Message) : IError
{
    public static readonly ExportBacklogError ProjectNotFound =
        new("backlog.export.project_not_found", "Проект не найден");
    public static readonly ExportBacklogError FileGenerationFailed =
        new("backlog.export.file_generation_failed", "Ошибка генерации файла");
    public static readonly ExportBacklogError UploadFailed =
        new("backlog.export.upload_failed", "Ошибка загрузки файла");
}
