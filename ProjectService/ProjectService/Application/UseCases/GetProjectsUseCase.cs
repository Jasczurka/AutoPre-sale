using ProjectService.Application.Common;
using ProjectService.Application.DTOs;
using ProjectService.Application.Errors;
using ProjectService.Domain.Repositories;

namespace ProjectService.Application.UseCases;

public class GetProjectsUseCase
{
    private readonly IProjectRepository _repo;

    public GetProjectsUseCase(IProjectRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<List<ProjectDto>, GetProjectsError>> Execute()
    {
        List<ProjectDto> list;
        try
        {
            var projects = await _repo.GetAllAsync();
            list = projects.Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                ClientName = p.ClientName,
                Status = p.Status,
                Description = p.Description,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();
        }
        catch
        {
            return Result<List<ProjectDto>, GetProjectsError>.Fail(GetProjectsError.Unknown);
        }

        return Result<List<ProjectDto>, GetProjectsError>.Success(list);
    }
}
