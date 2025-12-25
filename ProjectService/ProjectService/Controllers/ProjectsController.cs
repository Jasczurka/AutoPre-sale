using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectService.Application.Common;
using ProjectService.Application.DTOs;
using ProjectService.Application.UseCases;
using ProjectService.Application.Errors;
using ProjectService.Domain.Repositories;

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

    public ProjectsController(CreateProjectUseCase create, GetProjectsUseCase list, GetProjectByIdUseCase getById, UploadProjectDocumentUseCase uploadDocument, DeleteProjectUseCase delete, UpdateProjectUseCase update, DownloadTkpUseCase downloadTkp)
    {
        _create = create;
        _list = list;
        _getById = getById;
        _uploadDocument = uploadDocument;
        _delete = delete;
        _update = update;
        _downloadTkp = downloadTkp;
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
}