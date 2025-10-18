using AuthService.Models;

namespace AuthService.Application.DTOs;

public sealed record IssuedRefreshToken(RefreshToken Stored, string Plain);
