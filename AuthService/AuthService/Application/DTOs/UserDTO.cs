namespace AuthService.Application.DTOs;

public class UserDTO
{
    public required string Id { get; set; }
    public required string FullName { get; set; }
    public required string Email { get; set; }
}