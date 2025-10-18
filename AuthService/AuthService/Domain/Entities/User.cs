using System.ComponentModel.DataAnnotations;

namespace AuthService.Models;

public class User
{
    public Guid Id { get; set; }
    [MaxLength(320)]
    public required String Email { get; set; }
    public required byte[] PasswordHash { get; set; }
    [MaxLength(64)]
    public required String Salt { get; set; }
    [MaxLength(255)]
    public required String FullName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public List<RefreshToken> RefreshTokens { get; set; } = new();
}