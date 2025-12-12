using ProjectService.Application.Common;

namespace ProjectService.Application.Errors;

public sealed record DeleteProjectError(string Code, string Message) : IError
{
    public static readonly DeleteProjectError NotFound =
        new("project.delete.not_found", "Проект не найден");

    public static readonly DeleteProjectError InvalidId =
        new("project.delete.invalid_id", "Неверный ID проекта");
}
