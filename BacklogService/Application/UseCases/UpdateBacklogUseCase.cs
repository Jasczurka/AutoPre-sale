using BacklogService.Application.Common;
using BacklogService.Application.DTOs;
using BacklogService.Application.Errors;
using BacklogService.Domain.Entities;
using BacklogService.Domain.Repositories;
using System.Linq;

namespace BacklogService.Application.UseCases;

public class UpdateBacklogUseCase
{
    private readonly IWorkRepository _repo;

    public UpdateBacklogUseCase(IWorkRepository repo)
    {
        _repo = repo;
    }

    private void UpdateHierarchy(Work work, string oldWorkNumber, string newWorkNumber, List<Work> allWorks, Dictionary<string, Work> workNumberDict)
    {
        var oldPrefix = oldWorkNumber + ".";
        var newPrefix = newWorkNumber + ".";
        var children = allWorks.Where(w => w.WorkNumber.StartsWith(oldPrefix)).ToList();
        foreach (var child in children)
        {
            var oldChildWorkNumber = child.WorkNumber;
            var childParts = child.WorkNumber.Split('.');
            var oldParts = oldWorkNumber.Split('.');
            var newChildWorkNumber = newPrefix + string.Join('.', childParts.Skip(oldParts.Length));
            child.WorkNumber = newChildWorkNumber;
            child.Level = newChildWorkNumber.Split('.').Length;
            child.ParentId = work.Id;
            child.UpdatedAt = DateTime.UtcNow;
            work.ChildWorks ??= new List<Work>();
            work.ChildWorks.Add(child);
            workNumberDict[newChildWorkNumber] = child;
            workNumberDict.Remove(oldChildWorkNumber);
            UpdateHierarchy(child, oldChildWorkNumber, newChildWorkNumber, allWorks, workNumberDict);
        }
    }

    public async Task<Result<Unit, UpdateBacklogError>> Execute(Guid projectId, List<WorkDto> dtos)
    {
        if (dtos == null || !dtos.Any())
            return Result<Unit, UpdateBacklogError>.Fail(UpdateBacklogError.InvalidData);

        var ids = dtos.Select(d => d.Id).ToList();
        if (ids.Distinct().Count() != ids.Count)
            return Result<Unit, UpdateBacklogError>.Fail(UpdateBacklogError.InvalidData);

        var workNumbers = dtos.Select(d => d.WorkNumber).ToList();
        if (workNumbers.Distinct().Count() != workNumbers.Count)
            return Result<Unit, UpdateBacklogError>.Fail(UpdateBacklogError.DuplicateWorkNumber);

        var existingWorks = await _repo.GetHierarchyByProjectIdAsync(projectId);
        var existingList = existingWorks.ToList();
        var existingDict = existingList.ToDictionary(w => w.Id);
        var workNumberDict = existingList.ToDictionary(w => w.WorkNumber);

        var startTime = DateTime.UtcNow;
        var worksToUpdate = new List<Work>();
        foreach (var dto in dtos)
        {
            if (!existingDict.TryGetValue(dto.Id, out var work))
                return Result<Unit, UpdateBacklogError>.Fail(UpdateBacklogError.WorkNotFound);

            var oldWorkNumber = work.WorkNumber;
            work.WorkNumber = dto.WorkNumber;
            var parts = dto.WorkNumber.Split('.');
            work.Level = parts.Length;
            work.Type = dto.Type;
            work.AcceptanceCriteria = dto.AcceptanceCriteria;
            work.UpdatedAt = DateTime.UtcNow;

            Guid? newParentId = null;
            if (parts.Length > 1)
            {
                var parentKey = string.Join('.', parts.Take(parts.Length - 1));
                if (!workNumberDict.TryGetValue(parentKey, out var newParent))
                    return Result<Unit, UpdateBacklogError>.Fail(UpdateBacklogError.InvalidWorkNumber);
                newParentId = newParent.Id;
            }
            var oldParentId = work.ParentId;
            work.ParentId = newParentId;

            var oldParts = oldWorkNumber.Split('.');
            if (oldParentId.HasValue && oldParts.Length > 1)
            {
                var oldParentKey = string.Join('.', oldParts.Take(oldParts.Length - 1));
                if (workNumberDict.TryGetValue(oldParentKey, out var oldParent))
                {
                    oldParent.ChildWorks?.Remove(work);
                }
            }
            if (newParentId.HasValue && workNumberDict.TryGetValue(string.Join('.', parts.Take(parts.Length - 1)), out var newParentWork))
            {
                newParentWork.ChildWorks ??= new List<Work>();
                newParentWork.ChildWorks.Add(work);
            }

            workNumberDict[dto.WorkNumber] = work;
            workNumberDict.Remove(oldWorkNumber);

            UpdateHierarchy(work, oldWorkNumber, dto.WorkNumber, existingList, workNumberDict);

            worksToUpdate.Add(work);
        }

        worksToUpdate = existingList.Where(w => w.UpdatedAt >= startTime).ToList();
        await _repo.UpdateRangeAsync(worksToUpdate);

        return Result<Unit, UpdateBacklogError>.Success(Unit.Value);
    }
}
