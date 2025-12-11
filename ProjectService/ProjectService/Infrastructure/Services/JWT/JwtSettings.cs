namespace ProjectService.Infrastructure.Services.JWT;

public class JwtSettings
{
    public string Issuer { get; set; } = null!;
    public string Audience { get; set; } = null!;
    public string PublicKey { get; set; } = null!;
}