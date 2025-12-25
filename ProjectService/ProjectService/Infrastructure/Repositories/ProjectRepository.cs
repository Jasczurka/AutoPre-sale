using Microsoft.EntityFrameworkCore;
using ProjectService.Domain.Entities;
using ProjectService.Domain.Repositories;
using ProjectService.Infrastructure.Data;

namespace ProjectService.Infrastructure.Repositories;

public class ProjectRepository : IProjectRepository
{
    private readonly AppDbContext _db;

    public ProjectRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Project?> GetByIdAsync(Guid id)
    {
        return await _db.Projects
            .Include(p => p.Documents)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<List<Project>> GetAllAsync()
    {
        return await _db.Projects
            .Include(p => p.Documents)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(Project project)
    {
        await _db.Projects.AddAsync(project);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateWithDocumentsAsync(Project project)
    {
        // Проект уже tracked после GetByIdAsync, его поля уже обновлены (UpdatedAt)
        // Просто добавляем новые документы
        foreach (var doc in project.Documents)
        {
            var docEntry = _db.Entry(doc);
            if (docEntry.State == EntityState.Detached)
            {
                _db.ProjectDocuments.Add(doc);
            }
        }

        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Project project)
    {
        _db.Projects.Update(project);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project != null)
        {
            _db.Projects.Remove(project);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<List<AnalysisResult>> GetAnalysisResultsByProjectIdAsync(Guid projectId)
    {
        return await _db.AnalysisResults
            .Where(ar => ar.ProjectId == projectId)
            .ToListAsync();
    }

    public async Task DeleteAnalysisResultsByProjectIdAsync(Guid projectId)
    {
        var analysisResults = await _db.AnalysisResults
            .Where(ar => ar.ProjectId == projectId)
            .ToListAsync();
        
        if (analysisResults.Any())
        {
            _db.AnalysisResults.RemoveRange(analysisResults);
            await _db.SaveChangesAsync();
        }
    }
}