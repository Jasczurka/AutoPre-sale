using BacklogService.Application.Common;
using BacklogService.Application.DTOs;
using BacklogService.Application.Errors;
using BacklogService.Domain.Entities;
using BacklogService.Domain.Repositories;
using System.Text.Json;

namespace BacklogService.Application.UseCases;

public class ImportBacklogUseCase
{
    private readonly IWorkRepository _repo;

    public ImportBacklogUseCase(IWorkRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<Unit, ImportBacklogError>> Execute(Guid projectId, ImportBacklogDto dto)
    {
        // Сначала удаляем все существующие работы для этого проекта
        // Это предотвращает дубликаты при повторном импорте
        var existingWorks = await _repo.GetHierarchyByProjectIdAsync(projectId);
        var allExistingWorks = FlattenHierarchy(existingWorks).ToList();
        if (allExistingWorks.Any())
        {
            await _repo.DeleteRangeAsync(allExistingWorks);
        }

        var works = new List<Work>();
        var workMap = new Dictionary<string, Work>();

        foreach (var item in dto.BacklogTable.OrderBy(i => i.WorkNumber))
        {
            var parts = item.WorkNumber.Split('.');
            if (parts.Length == 0 || !parts.All(p => int.TryParse(p, out _)))
                return Result<Unit, ImportBacklogError>.Fail(ImportBacklogError.InvalidWorkNumber);

            if (workMap.ContainsKey(item.WorkNumber))
                return Result<Unit, ImportBacklogError>.Fail(ImportBacklogError.DuplicateWorkNumber);

            Guid? parentId = null;
            if (parts.Length > 1)
            {
                var parentKey = string.Join('.', parts.Take(parts.Length - 1));
                if (!workMap.TryGetValue(parentKey, out var parent))
                    return Result<Unit, ImportBacklogError>.Fail(ImportBacklogError.InvalidWorkNumber);
                parentId = parent.Id;
            }

            var work = new Work
            {
                Id = Guid.NewGuid(),
                ProjectId = projectId,
                WorkNumber = item.WorkNumber,
                Level = parts.Length,
                WorkType = item.WorkType,
                AcceptanceCriteria = item.AcceptanceCriteria,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ParentId = parentId,
                ChildWorks = null
            };

            works.Add(work);
            workMap[item.WorkNumber] = work;
        }

        await _repo.AddRangeAsync(works);

        return Result<Unit, ImportBacklogError>.Success(Unit.Value);
    }

    // Вспомогательный метод для "распрямления" иерархии работ в плоский список
    private IEnumerable<Work> FlattenHierarchy(IEnumerable<Work> works)
    {
        foreach (var work in works)
        {
            yield return work;
            if (work.ChildWorks != null && work.ChildWorks.Any())
            {
                foreach (var child in FlattenHierarchy(work.ChildWorks))
                {
                    yield return child;
                }
            }
        }
    }
}
