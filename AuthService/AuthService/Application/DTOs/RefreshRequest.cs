namespace AuthService.Application.DTOs;

public class RefreshRequest
{
    public required string RefreshToken { get; set; }
    public required string UserId { get; set; }
}