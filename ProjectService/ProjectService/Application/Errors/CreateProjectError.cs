using ProjectService.Application.Common;

namespace ProjectService.Application.Errors;

public sealed record CreateProjectError(string Code, string Message) : IError
{
    public static readonly CreateProjectError InvalidData =
        new("project.create.invalid_data", "Неверные данные проекта");

    public static readonly CreateProjectError InvalidStatus =
        new("project.create.invalid_status", "Недопустимый статус проекта");
}
