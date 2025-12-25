namespace ProjectService.Application.Errors;

using ProjectService.Application.Common;

public sealed record DownloadTkpError : IError
{
    public string Code { get; }
    public string Message { get; }

    private DownloadTkpError(string code, string message)
    {
        Code = code;
        Message = message;
    }

    public static DownloadTkpError ProjectNotFound() =>
        new("PROJECT_NOT_FOUND", "Проект не найден");

    public static DownloadTkpError TkpNotFound() =>
        new("TKP_NOT_FOUND", "ТКП не найден для этого проекта");

    public static DownloadTkpError DownloadFailed(string details) =>
        new("DOWNLOAD_FAILED", $"Ошибка при скачивании ТКП: {details}");
}
