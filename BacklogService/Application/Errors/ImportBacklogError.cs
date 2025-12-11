using BacklogService.Application.Common;

namespace BacklogService.Application.Errors;

public sealed record ImportBacklogError(string Code, string Message) : IError
{
    public static readonly ImportBacklogError InvalidJson =
        new("backlog.import.invalid_json", "Неверный формат JSON");

    public static readonly ImportBacklogError DuplicateWorkNumber =
        new("backlog.import.duplicate_work_number", "Дублированный номер работы");

    public static readonly ImportBacklogError InvalidWorkNumber =
        new("backlog.import.invalid_work_number", "Неверный формат номера работы");
}
