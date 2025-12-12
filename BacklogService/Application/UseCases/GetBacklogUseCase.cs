using BacklogService.Application.Common;
using BacklogService.Application.DTOs;
using BacklogService.Application.Errors;
using BacklogService.Domain.Entities;
using BacklogService.Domain.Repositories;

namespace BacklogService.Application.UseCases;

public class GetBacklogUseCase
{
    private readonly IWorkRepository _repo;

    public GetBacklogUseCase(IWorkRepository repo)
    {
        _repo = repo;
    }

    private static List<int> ParseWorkNumber(string workNumber)
    {
        return workNumber.Split('.').Select(int.Parse).ToList();
    }

    public async Task<Result<List<WorkDto>, GetBacklogError>> Execute(Guid projectId)
    {
        var works = await _repo.GetHierarchyByProjectIdAsync(projectId);
        var worksList = works.ToList();

        if (!worksList.Any())
            return Result<List<WorkDto>, GetBacklogError>.Fail(GetBacklogError.ProjectNotFound);

        var dtos = worksList.Where(w => w.ParentId == null).Select(MapToDto).OrderBy(dto => ParseWorkNumber(dto.WorkNumber).Last()).ToList();

        return Result<List<WorkDto>, GetBacklogError>.Success(dtos);
    }

    private WorkDto MapToDto(Work work)
    {
        return new WorkDto
        {
            Id = work.Id,
            WorkNumber = work.WorkNumber,
            Level = work.Level,
            Type = work.Type,
            AcceptanceCriteria = work.AcceptanceCriteria,
            ChildWorks = work.ChildWorks?.Select(MapToDto).OrderBy(dto => ParseWorkNumber(dto.WorkNumber).Last()).ToList()
        };
    }
}
