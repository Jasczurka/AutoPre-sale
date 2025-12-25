using ProjectService.Domain.Entities;

namespace ProjectService.Domain.Repositories;

public interface IProjectRepository
{
    Task<Project?> GetByIdAsync(Guid id);
    Task<List<Project>> GetAllAsync();
    Task AddAsync(Project project);
    Task UpdateWithDocumentsAsync(Project project);
    Task UpdateAsync(Project project);
    Task DeleteAsync(Guid id);
    Task<List<AnalysisResult>> GetAnalysisResultsByProjectIdAsync(Guid projectId);
    Task DeleteAnalysisResultsByProjectIdAsync(Guid projectId);
}
