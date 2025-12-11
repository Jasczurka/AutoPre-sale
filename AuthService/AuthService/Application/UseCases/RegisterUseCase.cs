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
        
        // Сохраняем данные ДО сохранения в БД для сравнения
        var passwordHashBeforeSave = (byte[])passwordHash.Clone();
        var passwordHashHexBeforeSave = Convert.ToHexString(passwordHashBeforeSave);
        
        var newUser = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = passwordHash,
            Salt = salt,
            FullName = $"{request.FirstName} {request.MiddleName ?? ""} {request.LastName}".Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var accessToken = _tokenService.GenerateAccessToken(newUser);
        var issued = _tokenService.GenerateRefreshToken();
        newUser.RefreshTokens.Add(issued.Stored);
        await _userRepository.AddUserAsync(newUser);
        
        // Проверяем данные ПОСЛЕ сохранения в БД
        var userAfterSave = await _userRepository.GetUserByEmail(request.Email);
        if (userAfterSave != null)
        {
            var passwordHashAfterSave = (byte[])userAfterSave.PasswordHash.Clone();
            var passwordHashHexAfterSave = Convert.ToHexString(passwordHashAfterSave);
            bool hashMatchesAfterSave = passwordHashBeforeSave.SequenceEqual(passwordHashAfterSave);
            
            if (!hashMatchesAfterSave)
            {
                throw new Exception($"HASH CHANGED AFTER SAVE: beforeSave={passwordHashHexBeforeSave.Substring(0, Math.Min(64, passwordHashHexBeforeSave.Length))}, afterSave={passwordHashHexAfterSave.Substring(0, Math.Min(64, passwordHashHexAfterSave.Length))}, email={request.Email}");
            }
        }
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