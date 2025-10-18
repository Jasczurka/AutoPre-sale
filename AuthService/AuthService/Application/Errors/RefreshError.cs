using AuthService.Application.Common;

namespace AuthService.Application.Errors;

public sealed record RefreshError(string Code, string Message) : IError
{
    public static readonly RefreshError InvalidToken =
        new("token.invalid", "Недействительный refresh token");
}