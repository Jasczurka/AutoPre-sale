namespace AuthService.Application.DTOs;

public class LoginResponse
{
    public required UserDTO User { get; set; }
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
}