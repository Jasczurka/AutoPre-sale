using System.Security.Cryptography;
using System.Text;
using AuthService.Application.DTOs;
using AuthService.Application.UseCases;
using AuthService.Data;
using AuthService.DTOs;
using AuthService.Infrastructure.Services;
using AuthService.Application.Errors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly RegisterUseCase _registerUseCase;
    private readonly RefreshTokenUseCase _refreshTokenUseCase;
    private readonly LoginUseCase _loginUseCase;

    public AuthController(AppDbContext db, ITokenService tokenService, RegisterUseCase registerUseCase, RefreshTokenUseCase refreshTokenUseCase, LoginUseCase loginUseCase)
    {
        _db = db;
        _tokenService = tokenService;
        _registerUseCase = registerUseCase;
        _refreshTokenUseCase = refreshTokenUseCase;
        _loginUseCase = loginUseCase;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _registerUseCase.Execute(request);
        if (!result.IsSuccess)
        {
            var error = result.Error;
            if (error == RegisterError.EmailAlreadyInUse)
            {
                return Conflict(new { error = error.Message, code = error.Code });
            }
            return BadRequest(new { error = error?.Message ?? "Ошибка регистрации", code = error?.Code ?? "unknown" });
        }

        return Ok(result.Value);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _loginUseCase.Execute(request);
        if (!result.IsSuccess)
        {
            var error = result.Error;
            if (error == LoginError.InvalidCredentials)
            {
                return Unauthorized(new { error = error.Message, code = error.Code });
            }
            return BadRequest(new { error = error?.Message ?? "Ошибка входа", code = error?.Code ?? "unknown" });
        }
        return Ok(result.Value);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var result = await _refreshTokenUseCase.Execute(request);
        if (!result.IsSuccess)
        {
            var error = result.Error;
            if (error == RefreshError.InvalidToken)
            {
                return Unauthorized(new { error = error.Message, code = error.Code });
            }
            return BadRequest(new { error = error?.Message ?? "Ошибка обновления токена", code = error?.Code ?? "unknown" });
        }
        return Ok(result.Value);
    }
    
}