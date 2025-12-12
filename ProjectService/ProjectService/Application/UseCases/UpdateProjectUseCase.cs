using ProjectService.Application.Common;
using ProjectService.Application.DTOs;
using ProjectService.Application.Errors;
using ProjectService.Domain.Entities;
using ProjectService.Domain.Repositories;

namespace ProjectService.Application.UseCases;

public class UpdateProjectUseCase
{
    private readonly IProjectRepository _repo;

    public UpdateProjectUseCase(IProjectRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<ProjectDto, UpdateProjectError>> Execute(UpdateProjectRequest request)
    {
        var project = await _repo.GetByIdAsync(request.Id);
        if (project == null)
            return Result<ProjectDto, UpdateProjectError>.Fail(UpdateProjectError.NotFound);

        if (!string.IsNullOrWhiteSpace(request.Name))
            project.Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.ClientName))
            project.ClientName = request.ClientName.Trim();
        if (request.Status.HasValue)
            project.Status = request.Status.Value;
        if (request.Description != null)
            project.Description = request.Description.Trim();

        project.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(project);

        var dto = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            ClientName = project.ClientName,
            Status = project.Status,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt
        };

        return Result<ProjectDto, UpdateProjectError>.Success(dto);
    }
}
