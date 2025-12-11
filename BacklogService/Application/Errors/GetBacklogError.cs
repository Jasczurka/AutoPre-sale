using BacklogService.Application.Common;

namespace BacklogService.Application.Errors;

public sealed record GetBacklogError(string Code, string Message) : IError
{
    public static readonly GetBacklogError ProjectNotFound =
        new("backlog.get.project_not_found", "Проект не найден");
}
