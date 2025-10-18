namespace AuthService.Infrastructure.Services.JWT;

public class JwtSettings
{
    public string Issuer { get; set; } = null!;
    public string Audience { get; set; } = null!;
    public string PrivateKey { get; set; } = null!;
    public string PublicKey { get; set; } = null!;
    public int AccessTokenLifetimeMinutes { get; set; }
    public int RefreshTokenLifetimeDays { get; set; }
}