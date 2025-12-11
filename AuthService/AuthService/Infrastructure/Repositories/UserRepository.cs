using AuthService.Data;
using AuthService.Domain.Repositories;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> IsEmailTakenAsync(string email)
    {
        var test = await _db.Users.AnyAsync(u => u.Email == email);
        return test;
    }
    
    public async Task<User?> GetUserByEmail(string email)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email);
        
        return user;
    }

    public async Task<User?> GetUserById(string id)
    {
        var user = await _db.Users.FindAsync(Guid.Parse(id));
        return user;
    }

    public async Task AddUserAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateUserAsync(User user)
    {
        _db.Users.Update(user);
        (await _db.Users.FindAsync(user.Id))!.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<User?> GetUserByIdWithTokensAsync(string userId)
    {
        return await _db.Users.Include(u => u.RefreshTokens).FirstOrDefaultAsync(u => u.Id.ToString() == userId);
    }
}