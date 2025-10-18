using AuthService.Models;

namespace AuthService.Infrastructure.Services;

public interface ICryptographyService
{
    public string GenerateSalt();
    public byte[] HashPassword(string password, string salt);
    public string HashRefreshToken(string refreshToken);
}