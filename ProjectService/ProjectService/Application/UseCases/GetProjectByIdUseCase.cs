using ProjectService.Application.Common;
using ProjectService.Application.DTOs;
using ProjectService.Application.Errors;
using ProjectService.Domain.Repositories;

namespace ProjectService.Application.UseCases;

public class GetProjectByIdUseCase
{
    private readonly IProjectRepository _repo;

    public GetProjectByIdUseCase(IProjectRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<ProjectDto, GetProjectByIdError>> Execute(Guid id)
    {
        if (id == Guid.Empty)
            return Result<ProjectDto, GetProjectByIdError>.Fail(GetProjectByIdError.InvalidId);

        var project = await _repo.GetByIdAsync(id);
        if (project is null)
            return Result<ProjectDto, GetProjectByIdError>.Fail(GetProjectByIdError.NotFound);

        var analysisResults = await _repo.GetAnalysisResultsByProjectIdAsync(id);

        var dto = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            ClientName = project.ClientName,
            Status = project.Status,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            Document = project.Documents.FirstOrDefault() != null ? new ProjectDocumentDto
            {
                Id = project.Documents.First().Id,
                FileName = project.Documents.First().FileName,
                FileUrl = project.Documents.First().FileUrl,
                UploadedAt = project.Documents.First().UploadedAt,
                Processed = project.Documents.First().Processed
            } : null,
            AnalysisResult = analysisResults.FirstOrDefault() != null ? new AnalysisResultDto
            {
                Id = analysisResults.First().Id,
                Status = analysisResults.First().Status,
                StartedAt = analysisResults.First().StartedAt,
                CompletedAt = analysisResults.First().CompletedAt
            } : null
        };

        return Result<ProjectDto, GetProjectByIdError>.Success(dto);
    }
}
