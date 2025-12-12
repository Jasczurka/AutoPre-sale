using BacklogService.Domain.Entities;

namespace BacklogService.Domain.Repositories;

public interface IWorkRepository
{
    Task AddRangeAsync(IEnumerable<Work> works);
    Task<IEnumerable<Work>> GetHierarchyByProjectIdAsync(Guid projectId);
    Task UpdateRangeAsync(IEnumerable<Work> works);
}
