using AuthService.Application.Common;
using AuthService.Application.DTOs;
using AuthService.Application.Errors;
using AuthService.Domain.Repositories;
using AuthService.DTOs;
using AuthService.Infrastructure.Services;
using AuthService.Models;

namespace AuthService.Application.UseCases;

public class LoginUseCase
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly ICryptographyService _cryptographyService;

    public LoginUseCase(IUserRepository userRepository, ICryptographyService cryptographyService, ITokenService tokenService)
    {
        _userRepository = userRepository;
        _cryptographyService = cryptographyService;
        _tokenService = tokenService;
    }
    
    public async Task<Result<LoginResponse, LoginError>> Execute(LoginRequest request)
    {
        var user = await _userRepository.GetUserByEmail(request.Email);
        if (user == null)
        {
            return Result<LoginResponse, LoginError>.Fail(LoginError.InvalidCredentials);
        }

        var hashedPassword = _cryptographyService.HashPassword(request.Password, user.Salt);
        if (hashedPassword != user.PasswordHash)
        {
            return Result<LoginResponse, LoginError>.Fail(LoginError.InvalidCredentials);
        }
        var accessToken = _tokenService.GenerateAccessToken(user);
        var issued = _tokenService.GenerateRefreshToken();
        user.RefreshTokens.Add(issued.Stored);
        
        await _userRepository.UpdateUserAsync(user);
        
        return Result<LoginResponse, LoginError>.Success(new LoginResponse
        {
            User = new UserDTO
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                FullName = user.FullName,
            },
            AccessToken = accessToken,
            RefreshToken = issued.Plain,
        });
    }
}