using AuthService.Domain.Repositories;
using AuthService.DTOs;
using AuthService.Infrastructure.Services;
using AuthService.Models;
using AuthService.Application.Common;
using AuthService.Application.DTOs;
using AuthService.Application.Errors;

namespace AuthService.Application.UseCases;

public class RegisterUseCase
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly ICryptographyService _cryptographyService;
    
    public RegisterUseCase(IUserRepository userRepository, ITokenService tokenService, ICryptographyService cryptographyService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _cryptographyService = cryptographyService;
    }

    public async Task<Result<LoginResponse, RegisterError>> Execute(RegisterRequest request)
    {
        var emailTaken = await _userRepository.IsEmailTakenAsync(request.Email);
        if (emailTaken)
        {
            return Result<LoginResponse, RegisterError>.Fail(RegisterError.EmailAlreadyInUse);
        }
        var salt = _cryptographyService.GenerateSalt();
        var passwordHash = _cryptographyService.HashPassword(request.Password, salt);
        var newUser = new User
        {
            Email = request.Email,
            PasswordHash = passwordHash,
            Salt = salt,
            FullName = request.FirstName + " " + request.MiddleName + " " + request.LastName,
            CreatedAt = DateTime.UtcNow
        };
        var accessToken = _tokenService.GenerateAccessToken(newUser);
        var issued = _tokenService.GenerateRefreshToken();
        newUser.RefreshTokens.Add(issued.Stored);
        await _userRepository.AddUserAsync(newUser);
        return Result<LoginResponse, RegisterError>.Success(new LoginResponse
        {
            User = new UserDTO
            {
                Id = newUser.Id.ToString(),
                Email = newUser.Email,
                FullName = newUser.FullName,
            },
            AccessToken = accessToken,
            RefreshToken = issued.Plain,
        });
    }
    
}