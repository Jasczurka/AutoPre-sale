using AuthService.Application.Common;

namespace AuthService.Application.Errors;

public sealed record RegisterError(string Code, string Message) : IError
{
    public static readonly RegisterError EmailAlreadyInUse =
        new("user.email_in_use", "Пользователь с таким email уже существует");
}
