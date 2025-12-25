using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectService.Application.Common;
using ProjectService.Application.DTOs;
using ProjectService.Application.UseCases;
using ProjectService.Application.Errors;
using ProjectService.Domain.Repositories;
using ProjectService.Infrastructure.Services;

namespace ProjectService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase {
    private readonly CreateProjectUseCase _create;
    private readonly GetProjectsUseCase _list;
    private readonly GetProjectByIdUseCase _getById;
    private readonly UploadProjectDocumentUseCase _uploadDocument;
    private readonly DeleteProjectUseCase _delete;
    private readonly UpdateProjectUseCase _update;
    private readonly DownloadTkpUseCase _downloadTkp;
    private readonly ProjectEventHub _eventHub;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(
        CreateProjectUseCase create, 
        GetProjectsUseCase list, 
        GetProjectByIdUseCase getById, 
        UploadProjectDocumentUseCase uploadDocument, 
        DeleteProjectUseCase delete, 
        UpdateProjectUseCase update, 
        DownloadTkpUseCase downloadTkp,
        ProjectEventHub eventHub,
        ILogger<ProjectsController> logger)
    {
        _create = create;
        _list = list;
        _getById = getById;
        _uploadDocument = uploadDocument;
        _delete = delete;
        _update = update;
        _downloadTkp = downloadTkp;
        _eventHub = eventHub;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProjectDto), (int)HttpStatusCode.Created)]
    [ProducesResponseType(typeof(CreateProjectError), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest request)
    {
        var result = await _create.Execute(request);
        if (!result.IsSuccess)
        {
            var error = result.Error!;
            if (error == CreateProjectError.InvalidStatus)
                return BadRequest(new { error = error.Message, code = error.Code });
            if (error == CreateProjectError.InvalidData)
                return BadRequest(new { error = error.Message, code = error.Code });
            return BadRequest(new { error = error?.Message ?? "Ошибка создания проекта", code = error?.Code ?? "unknown" });
        }
        return Created((string?)null, result.Value);
    }
    
    [HttpGet]
    [ProducesResponseType(typeof(List<ProjectDto>), (int)HttpStatusCode.OK)]
    [ProducesResponseType(typeof(GetProjectsError), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _list.Execute();
        if (!result.IsSuccess)
        {
            var error = result.Error;
            return BadRequest(new { error = error?.Message, code = error?.Code });
        }
        return Ok(result.Value);
    }
    
    
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProjectDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType(typeof(GetProjectByIdError), (int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(GetProjectByIdError), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _getById.Execute(id);
        if (!result.IsSuccess)
        {
            var error = result.Error;
            if (error == GetProjectByIdError.NotFound)
                return NotFound(new { error = error.Message, code = error.Code });
            if (error == GetProjectByIdError.InvalidId)
                return BadRequest(new { error = error.Message, code = error.Code });
            return BadRequest(new { error = error?.Message ?? "Ошибка получения проекта", code = error?.Code ?? "unknown" });
        }
        return Ok(result.Value);
    }

    [HttpPost("{id:guid}/documents")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ProjectDocumentDto), (int)HttpStatusCode.Created)]
    [ProducesResponseType(typeof(UploadProjectDocumentError), (int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(UploadProjectDocumentError), (int)HttpStatusCode.BadRequest)]
    [ProducesResponseType(typeof(UploadProjectDocumentError), (int)HttpStatusCode.InternalServerError)]
    public async Task<IActionResult> UploadDocument(Guid id, IFormFile file)
    {
        var result = await _uploadDocument.Execute(id, file);
        if (!result.IsSuccess)
        {
            var error = result.Error!;
            if (error == UploadProjectDocumentError.ProjectNotFound)
                return NotFound(new { error = error.Message, code = error.Code });
            if (error == UploadProjectDocumentError.InvalidFile)
                return BadRequest(new { error = error.Message, code = error.Code });
            if (error == UploadProjectDocumentError.UploadFailed)
                return StatusCode(500, new { error = error.Message, code = error.Code });
            if (error == UploadProjectDocumentError.DuplicateFile)
                return BadRequest(new { error = error.Message, code = error.Code });
            return BadRequest(new { error = error?.Message ?? "Ошибка загрузки документа", code = error?.Code ?? "unknown" });
        }
        return CreatedAtAction(nameof(GetById), new { id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProjectDto), (int)HttpStatusCode.OK)]
    [ProducesResponseType(typeof(UpdateProjectError), (int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(UpdateProjectError), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectRequest request)
    {
        request.Id = id; // Ensure the ID matches the route
        var result = await _update.Execute(request);
        if (!result.IsSuccess)
        {
            var error = result.Error!;
            if (error == UpdateProjectError.NotFound)
                return NotFound(new { error = error.Message, code = error.Code });
            if (error == UpdateProjectError.InvalidData)
                return BadRequest(new { error = error.Message, code = error.Code });
            if (error == UpdateProjectError.InvalidStatus)
                return BadRequest(new { error = error.Message, code = error.Code });
            return BadRequest(new { error = error?.Message ?? "Ошибка обновления проекта", code = error?.Code ?? "unknown" });
        }
        return Ok(result.Value);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(DeleteProjectError), (int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(DeleteProjectError), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _delete.Execute(id);
        if (!result.IsSuccess)
        {
            var error = result.Error!;
            if (error == DeleteProjectError.NotFound)
                return NotFound(new { error = error.Message, code = error.Code });
            if (error == DeleteProjectError.InvalidId)
                return BadRequest(new { error = error.Message, code = error.Code });
            return BadRequest(new { error = error?.Message ?? "Ошибка удаления проекта", code = error?.Code ?? "unknown" });
        }
        return NoContent();
    }

    [HttpDelete("{id:guid}/documents/{documentId:guid}")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> DeleteDocument(
        Guid id, 
        Guid documentId,
        [FromServices] IProjectRepository repo,
        [FromServices] IStorageService storage)
    {
        var project = await repo.GetByIdAsync(id);
        if (project == null)
            return NotFound(new { error = "Проект не найден", code = "project.not_found" });

        var document = project.Documents.FirstOrDefault(d => d.Id == documentId);
        if (document == null)
            return NotFound(new { error = "Документ не найден", code = "document.not_found" });

        // Извлекаем ключ MinIO из URL
        var uri = new Uri(document.FileUrl);
        var pathParts = uri.AbsolutePath.TrimStart('/').Split('/', 2);
        var minioKey = pathParts.Length > 1 ? pathParts[1] : uri.AbsolutePath.TrimStart('/');

        // Удаляем файл из MinIO
        try
        {
            await storage.DeleteFileAsync(minioKey);
        }
        catch
        {
            // Логируем ошибку, но продолжаем удаление из БД
            // В production здесь должен быть proper logging
        }

        // Удаляем документ из проекта
        project.Documents.Remove(document);
        project.UpdatedAt = DateTime.UtcNow;
        await repo.UpdateWithDocumentsAsync(project);

        return NoContent();
    }

    [HttpGet("{id:guid}/tkp/download")]
    [ProducesResponseType(typeof(FileResult), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> DownloadTkp(Guid id)
    {
        var result = await _downloadTkp.Execute(id);
        if (!result.IsSuccess)
        {
            var error = result.Error!;
            return NotFound(new { error = error.Message, code = error.Code });
        }

        var (stream, fileName, contentType) = result.Value;
        return File(stream, contentType, fileName);
    }

    /// <summary>
    /// SSE endpoint для получения real-time обновлений статуса анализа проекта.
    /// Доступен без авторизации, т.к. EventSource API не поддерживает custom headers.
    /// </summary>
    [HttpGet("{id:guid}/events")]
    [AllowAnonymous]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    public async Task GetEvents(Guid id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("===== SSE ENDPOINT CALLED ===== Client connecting to events stream for project {ProjectId}", id);
        _logger.LogInformation("Request Headers: {Headers}", string.Join(", ", Request.Headers.Select(h => $"{h.Key}={h.Value}")));
        _logger.LogInformation("Request Path: {Path}", Request.Path);
        _logger.LogInformation("Request Query: {Query}", Request.QueryString);

        // Настраиваем SSE заголовки
        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";
        Response.Headers["X-Accel-Buffering"] = "no"; // Для nginx
        
        _logger.LogInformation("SSE Headers set for project {ProjectId}", id);

        // Не используем AutoFlush, т.к. он вызывает синхронный Flush
        // Вместо этого вручную вызываем FlushAsync после каждой записи
        var writer = new StreamWriter(Response.Body);
        
        try
        {
            _logger.LogInformation("Subscribing client to event hub for project {ProjectId}", id);
            // Подписываем клиента на события проекта
            _eventHub.Subscribe(id, writer);

            _logger.LogInformation("Sending connection confirmation event for project {ProjectId}", id);
            // Отправляем первоначальное событие подтверждения подключения
            try 
            {
                await writer.WriteAsync($"event: connected\ndata: {{\"projectId\":\"{id}\"}}\n\n");
                await writer.FlushAsync();
                _logger.LogInformation("Connection confirmation event sent successfully for project {ProjectId}", id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send connection confirmation event for project {ProjectId}", id);
                throw;
            }

            _logger.LogInformation("===== CLIENT SUCCESSFULLY CONNECTED ===== to events stream for project {ProjectId}", id);

            // Удерживаем соединение открытым до отмены или отключения клиента
            // Отправляем heartbeat каждые 30 секунд для поддержания соединения
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(30000, cancellationToken);
                    _logger.LogDebug("Sending heartbeat for project {ProjectId}", id);
                    await writer.WriteAsync(": heartbeat\n\n");
                    await writer.FlushAsync();
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error sending heartbeat to client for project {ProjectId}", id);
                    break;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SSE connection for project {ProjectId}", id);
        }
        finally
        {
            // Отписываем клиента при разрыве соединения
            _eventHub.Unsubscribe(id, writer);
            _logger.LogInformation("Client disconnected from events stream for project {ProjectId}", id);
        }
    }
}