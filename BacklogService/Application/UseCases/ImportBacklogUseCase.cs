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
                Type = item.WorkType,
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
}
