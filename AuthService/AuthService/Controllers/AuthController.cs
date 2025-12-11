using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using AuthService.Application.DTOs;
using AuthService.Application.UseCases;
using AuthService.DTOs;
using AuthService.Application.Errors;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly RegisterUseCase _registerUseCase;
    private readonly RefreshTokenUseCase _refreshTokenUseCase;
    private readonly LoginUseCase _loginUseCase;
    private readonly GetMeUseCase _getMeUseCase;

    public AuthController(RegisterUseCase registerUseCase, RefreshTokenUseCase refreshTokenUseCase, LoginUseCase loginUseCase, GetMeUseCase getMeUseCase)
    {
        _registerUseCase = registerUseCase;
        _refreshTokenUseCase = refreshTokenUseCase;
        _loginUseCase = loginUseCase;
        _getMeUseCase = getMeUseCase;
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

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { error = "User id not found in token" });

        var result = await _getMeUseCase.Execute(userId);
        if (!result.IsSuccess)
        {
            var error = result.Error;
            return NotFound(new { error = error?.Message, code = error?.Code });
        }

        return Ok(result.Value);
    }
    
}