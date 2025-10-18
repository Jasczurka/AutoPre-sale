using AuthService.Application.Common;
using AuthService.Application.DTOs;
using AuthService.Application.Errors;
using AuthService.Domain.Repositories;
using AuthService.Infrastructure.Services;

namespace AuthService.Application.UseCases;

public class RefreshTokenUseCase
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly ICryptographyService _cryptographyService;

    public RefreshTokenUseCase(IUserRepository userRepository, ITokenService tokenService, ICryptographyService cryptographyService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _cryptographyService = cryptographyService;
    }
    
    public async Task<Result<RefreshResponse, RefreshError>> Execute(RefreshRequest request)
    {
        var refreshTokenHash = _cryptographyService.HashRefreshToken(request.RefreshToken);
        var user = await _userRepository.GetUserByIdWithTokensAsync(request.UserId);
        if (user == null)
        {
            return Result<RefreshResponse, RefreshError>.Fail(RefreshError.InvalidToken);
        }
        if(!user.RefreshTokens.Any(rt => rt.Token == refreshTokenHash && rt.ExpiresAt > DateTime.UtcNow))
        {
            return Result<RefreshResponse, RefreshError>.Fail(RefreshError.InvalidToken);
        }
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshTokens.Add(refreshToken.Stored);
        await _userRepository.UpdateUserAsync(user);
        return Result<RefreshResponse, RefreshError>.Success(new RefreshResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Plain
        });
    }
}