using Microsoft.AspNetCore.Http;
using ProjectService.Application.Common;
using ProjectService.Application.DTOs;
using ProjectService.Application.Errors;
using ProjectService.Domain.Entities;
using ProjectService.Domain.Repositories;
using ProjectService.Infrastructure.Services;

namespace ProjectService.Application.UseCases;

public class UploadProjectDocumentUseCase
{
    private readonly IProjectRepository _repo;
    private readonly IStorageService _storage;
    private readonly IEventBusService _eventBus;

    public UploadProjectDocumentUseCase(IProjectRepository repo, IStorageService storage, IEventBusService eventBus)
    {
        _repo = repo;
        _storage = storage;
        _eventBus = eventBus;
    }

    public async Task<Result<ProjectDocumentDto, UploadProjectDocumentError>> Execute(Guid projectId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return Result<ProjectDocumentDto, UploadProjectDocumentError>.Fail(UploadProjectDocumentError.InvalidFile);

        // Очищаем старые результаты анализа ДО загрузки проекта
        // Это предотвращает конфликты tracking в EF Core
        await _repo.DeleteAnalysisResultsByProjectIdAsync(projectId);

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
        catch (Exception ex)
        {
            // Log the exception
            Console.WriteLine($"Error saving document: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            
            // If save fails, try to delete the uploaded file
            // Note: Implement delete in storage service if needed
            return Result<ProjectDocumentDto, UploadProjectDocumentError>.Fail(UploadProjectDocumentError.UploadFailed);
        }

        // Публикуем событие FileUploaded в Event Bus
        // Отправляем путь к объекту в MinIO (key), а не полный URL
        try
        {
            await _eventBus.PublishFileUploadedAsync(projectId, key);
        }
        catch
        {
            // Логируем ошибку, но не прерываем выполнение, так как файл уже загружен
            // В production здесь должен быть proper logging
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
