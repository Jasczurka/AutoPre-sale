using BacklogService.Application.Common;

namespace BacklogService.Application.Errors;

public sealed record UpdateBacklogError(string Code, string Message) : IError
{
    public static readonly UpdateBacklogError WorkNotFound =
        new("backlog.update.work_not_found", "Работа не найдена");

    public static readonly UpdateBacklogError InvalidData =
        new("backlog.update.invalid_data", "Неверные данные для обновления");

    public static readonly UpdateBacklogError DuplicateWorkNumber =
        new("backlog.update.duplicate_work_number", "Дублированный номер работы");

    public static readonly UpdateBacklogError InvalidWorkNumber =
        new("backlog.update.invalid_work_number", "Неверный номер работы");
}
