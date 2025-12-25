using ProjectService.Application.Common;
using ProjectService.Application.Errors;
using ProjectService.Domain.Repositories;

namespace ProjectService.Application.UseCases;

public class DownloadTkpUseCase
{
    private readonly IProjectRepository _repo;
    private readonly IStorageService _storage;
    private readonly ILogger<DownloadTkpUseCase> _logger;

    public DownloadTkpUseCase(IProjectRepository repo, IStorageService storage, ILogger<DownloadTkpUseCase> logger)
    {
        _repo = repo;
        _storage = storage;
        _logger = logger;
    }

    public async Task<Result<(Stream stream, string fileName, string contentType), DownloadTkpError>> Execute(Guid projectId)
    {
        var project = await _repo.GetByIdAsync(projectId);
        if (project == null)
        {
            return Result<(Stream stream, string fileName, string contentType), DownloadTkpError>.Fail(DownloadTkpError.ProjectNotFound());
        }

        var analysisResults = await _repo.GetAnalysisResultsByProjectIdAsync(projectId);
        var analysis = analysisResults.FirstOrDefault();
        
        if (analysis == null || string.IsNullOrEmpty(analysis.TkpUrl))
        {
            return Result<(Stream stream, string fileName, string contentType), DownloadTkpError>.Fail(DownloadTkpError.TkpNotFound());
        }

        try
        {
            // Извлекаем ключ MinIO из URL
            // URL формата: http://minio:9000/documents/tkp/{analysis_id}.json
            var uri = new Uri(analysis.TkpUrl);
            var pathParts = uri.AbsolutePath.TrimStart('/').Split('/', 2);
            var minioKey = pathParts.Length > 1 ? pathParts[1] : uri.AbsolutePath.TrimStart('/');

            _logger.LogInformation("Downloading TKP from MinIO with key: {MinioKey}", minioKey);

            // Скачиваем файл из MinIO
            var stream = await _storage.DownloadFileAsync(minioKey);
            var fileName = $"tkp_{projectId}_{DateTime.UtcNow:yyyyMMddHHmmss}.json";
            var contentType = "application/json";

            return Result<(Stream stream, string fileName, string contentType), DownloadTkpError>.Success((stream, fileName, contentType));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading TKP for project {ProjectId}", projectId);
            return Result<(Stream stream, string fileName, string contentType), DownloadTkpError>.Fail(DownloadTkpError.DownloadFailed(ex.Message));
        }
    }
}
