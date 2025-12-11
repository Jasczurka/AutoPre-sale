using ProjectService.Application.Common;

namespace ProjectService.Application.Errors;

public sealed record UpdateProjectError(string Code, string Message) : IError
{
    public static readonly UpdateProjectError NotFound =
        new("project.update.not_found", "Проект не найден");

    public static readonly UpdateProjectError InvalidData =
        new("project.update.invalid_data", "Неверные данные проекта");

    public static readonly UpdateProjectError InvalidStatus =
        new("project.update.invalid_status", "Недопустимый статус проекта");
}
