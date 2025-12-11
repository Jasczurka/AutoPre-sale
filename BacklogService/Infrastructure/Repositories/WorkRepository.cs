using BacklogService.Domain.Entities;
using BacklogService.Domain.Repositories;
using BacklogService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BacklogService.Infrastructure.Repositories;

public class WorkRepository : IWorkRepository
{
    private readonly AppDbContext _context;

    public WorkRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddRangeAsync(IEnumerable<Work> works)
    {
        await _context.Works.AddRangeAsync(works);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Work>> GetHierarchyByProjectIdAsync(Guid projectId)
    {
        var all = await _context.Works
            .Where(w => w.ProjectId == projectId)
            .ToListAsync();

        // var byId = all.ToDictionary(w => w.Id);


        // foreach (var w in all)
        // {
        //     if (w.ParentId != null && byId.TryGetValue(w.ParentId.Value, out var parent))
        //     {
        //         parent.ChildWorks ??= new();
        //         parent.ChildWorks.Add(w);
        //     }
        // }

        return all.Where(w => w.ParentId == null);
    }

    public async Task UpdateRangeAsync(IEnumerable<Work> works)
    {
        _context.Works.UpdateRange(works);
        await _context.SaveChangesAsync();
    }
}
