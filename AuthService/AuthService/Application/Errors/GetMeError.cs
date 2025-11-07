using AuthService.Application.Common;

namespace AuthService.Application.Errors;

public sealed record GetMeError(string Code, string Message) : IError
{
    public static readonly GetMeError UserNotFound = new("user.not_found", "Пользователь не найден");
}
