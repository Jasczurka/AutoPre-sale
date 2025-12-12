using ProjectService.Application.Common;

namespace ProjectService.Application.Errors;

public sealed record GetProjectsError(string Code, string Message) : IError
{
    public static readonly GetProjectsError Unknown =
        new("project.get_list.unknown", "Не удалось получить список проектов");
}
