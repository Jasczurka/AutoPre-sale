using Microsoft.AspNetCore.Http;
using ProjectService.Application.Common;
using ProjectService.Application.DTOs;
using ProjectService.Application.Errors;
using ProjectService.Domain.Entities;
using ProjectService.Domain.Repositories;

namespace ProjectService.Application.UseCases;

public class UploadProjectDocumentUseCase
{
    private readonly IProjectRepository _repo;
    private readonly IStorageService _storage;

    public UploadProjectDocumentUseCase(IProjectRepository repo, IStorageService storage)
    {
        _repo = repo;
        _storage = storage;
    }

    public async Task<Result<ProjectDocumentDto, UploadProjectDocumentError>> Execute(Guid projectId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return Result<ProjectDocumentDto, UploadProjectDocumentError>.Fail(UploadProjectDocumentError.InvalidFile);

        var project = await _repo.GetByIdAsync(projectId);
        if (project == null)
            return Result<ProjectDocumentDto, UploadProjectDocumentError>.Fail(UploadProjectDocumentError.ProjectNotFound);

        // Проверка на дубликат по имени файла
        if (project.Documents.Any(d => d.FileName == file.FileName))
            return Result<ProjectDocumentDto, UploadProjectDocumentError>.Fail(UploadProjectDocumentError.DuplicateFile);

        var sanitizedFileName = SanitizeFileName(file.FileName);
        var key = $"{projectId}/{Guid.NewGuid()}_{sanitizedFileName}";

        string fileUrl;
        try
        {
            using var stream = file.OpenReadStream();
            fileUrl = await _storage.UploadFileAsync(stream, key, file.ContentType);
        }
        catch
        {
            return Result<ProjectDocumentDto, UploadProjectDocumentError>.Fail(UploadProjectDocumentError.UploadFailed);
        }

        var document = new ProjectDocument
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            FileName = file.FileName,
            FileUrl = fileUrl,
            UploadedAt = DateTime.UtcNow,
            Processed = false,
            Project = project
        };

        project.Documents.Add(document);
        project.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _repo.UpdateWithDocumentsAsync(project);
        }
        catch
        {
            // If save fails, try to delete the uploaded file
            // Note: Implement delete in storage service if needed
            return Result<ProjectDocumentDto, UploadProjectDocumentError>.Fail(UploadProjectDocumentError.UploadFailed);
        }

        var dto = new ProjectDocumentDto
        {
            Id = document.Id,
            FileName = document.FileName,
            FileUrl = document.FileUrl,
            UploadedAt = document.UploadedAt,
            Processed = document.Processed
        };

        return Result<ProjectDocumentDto, UploadProjectDocumentError>.Success(dto);
    }

    private static string SanitizeFileName(string fileName)
    {
        return string.Concat(fileName.Where(ch => char.IsLetterOrDigit(ch) || ch == '.' || ch == '-' || ch == '_'));
    }
}
