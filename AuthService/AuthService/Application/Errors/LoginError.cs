using AuthService.Application.Common;

namespace AuthService.Application.Errors;

public sealed record LoginError(string Code, string Message) : IError
{
    public static readonly LoginError InvalidCredentials =
        new("user.invalid_credentials", "Неверный email или пароль");
}