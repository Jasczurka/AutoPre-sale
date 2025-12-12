namespace BacklogService.Infrastructure.Data;

using Microsoft.EntityFrameworkCore;
using BacklogService.Domain.Entities;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    public DbSet<Work> Works => Set<Work>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Work>()
            .HasMany(w => w.ChildWorks)
            .WithOne()
            .HasForeignKey(w => w.ParentId);
    }
}