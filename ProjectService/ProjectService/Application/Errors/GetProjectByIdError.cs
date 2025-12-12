using ProjectService.Application.Common;

namespace ProjectService.Application.Errors;

public sealed record GetProjectByIdError(string Code, string Message) : IError
{
    public static readonly GetProjectByIdError InvalidId =
        new("project.get_by_id.invalid_id", "Неверный ID проекта");

    public static readonly GetProjectByIdError NotFound =
        new("project.get_by_id.not_found", "Проект не найден");
}
