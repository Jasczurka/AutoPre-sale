using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AuthService.Application.DTOs;
using AuthService.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Infrastructure.Services.JWT;

public class TokenService : ITokenService
{
    private readonly JwtSettings _jwt;
    private readonly ICryptographyService _cryptographyService;
    private readonly RsaSecurityKey _rsaKey;

    public TokenService(IOptions<JwtSettings> options, ICryptographyService cryptographyService, RsaSecurityKey rsaKey)
    {
        _jwt = options.Value;
        _cryptographyService = cryptographyService;
        _rsaKey = rsaKey;
    }


    public string GenerateAccessToken(User user)
    {
        var creds = new SigningCredentials(_rsaKey, SecurityAlgorithms.RsaSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email)
            },
            expires: DateTime.UtcNow.AddMinutes(_jwt.AccessTokenLifetimeMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    public IssuedRefreshToken GenerateRefreshToken()
    {
        var plain = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var expiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenLifetimeDays);

        var stored = new RefreshToken
        {
            Token = _cryptographyService.HashRefreshToken(plain),
            ExpiresAt = expiresAt
        };

        return new IssuedRefreshToken(stored, plain);
    }

    public bool IsTokenValid(string token, bool validateLifetime)
    {
        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = validateLifetime,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _jwt.Issuer,
            ValidAudience = _jwt.Audience,
            IssuerSigningKey = _rsaKey,
            ClockSkew = TimeSpan.Zero
        };

        var handler = new JwtSecurityTokenHandler();

        try
        {
            handler.ValidateToken(token, parameters, out _);
            return true;
        }
        catch
        {
            return false;
        }
    }
}