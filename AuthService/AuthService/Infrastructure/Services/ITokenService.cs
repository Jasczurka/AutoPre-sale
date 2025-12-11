using AuthService.Application.DTOs;
using AuthService.Models;

namespace AuthService.Infrastructure.Services;

public interface ITokenService
{
    public string GenerateAccessToken(User user);
    public IssuedRefreshToken GenerateRefreshToken();
}