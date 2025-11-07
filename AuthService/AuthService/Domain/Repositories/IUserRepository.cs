using AuthService.Data;
using AuthService.Models;

namespace AuthService.Domain.Repositories;

public interface IUserRepository
{
    public Task<bool> IsEmailTakenAsync(string email);
    public Task<User?> GetUserByEmail(string email);
    public Task<User?> GetUserById(string id);
    public Task AddUserAsync(User user);
    public Task UpdateUserAsync(User user);
    public Task<User?> GetUserByIdWithTokensAsync(string userId);
}