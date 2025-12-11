using System.Security.Cryptography;
using System.Text;
using AuthService.Models;

namespace AuthService.Infrastructure.Services;

public class CryptographyService : ICryptographyService
{
    public string GenerateSalt()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    }

    public byte[] HashPassword(string password, string salt)
    {
        return SHA256.HashData(Encoding.UTF8.GetBytes(password + salt));
    }

    public string HashRefreshToken(string refreshToken)
    {
        refreshToken = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
        return refreshToken;
    }
}