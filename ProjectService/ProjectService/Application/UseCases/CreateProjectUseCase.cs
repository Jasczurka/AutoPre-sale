using ProjectService.Application.Common;
using ProjectService.Application.DTOs;
using ProjectService.Application.Errors;
using ProjectService.Application.Common.Parsers;
using ProjectService.Domain.Entities;
using ProjectService.Domain.Enums;
using ProjectService.Domain.Repositories;

namespace ProjectService.Application.UseCases;

public class CreateProjectUseCase
{
    private readonly IProjectRepository _repo;

    public CreateProjectUseCase(IProjectRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<ProjectDto, CreateProjectError>> Execute(CreateProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.ClientName))
            return Result<ProjectDto, CreateProjectError>.Fail(CreateProjectError.InvalidData);

        // if (!ProjectStatusParser.TryParse(request.Status, out var statusEnum))
        //     return Result<ProjectDto, CreateProjectError>.Fail(CreateProjectError.InvalidStatus);

        var now = DateTime.UtcNow;
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            ClientName = request.ClientName.Trim(),
            Status = request.Status ?? ProjectStatus.Active,
            Description = request.Description.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        await _repo.AddAsync(project);

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

        return Result<ProjectDto, CreateProjectError>.Success(dto);
    }
}
