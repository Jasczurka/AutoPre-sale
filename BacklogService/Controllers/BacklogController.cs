using System.Net;
using BacklogService.Application.DTOs;
using BacklogService.Application.Errors;
using BacklogService.Application.UseCases;
using Microsoft.AspNetCore.Mvc;

namespace BacklogService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BacklogController : ControllerBase
    {
        [HttpPost("import")]
        public async Task<IActionResult> Import([FromQuery] Guid projectId, [FromBody] ImportBacklogDto dto, [FromServices] ImportBacklogUseCase useCase)
        {
            var result = await useCase.Execute(projectId, dto);
            if (result.IsSuccess)
                return Ok();
            return BadRequest(result.Error);
        }

        [HttpGet("{projectId}")]
        [ProducesResponseType(typeof(List<WorkDto>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(GetBacklogError), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> Get(Guid projectId, [FromServices] GetBacklogUseCase useCase, [FromServices] ILogger<BacklogController> logger)
        {
            logger.LogInformation("Get backlog request for project {ProjectId}", projectId);
            var result = await useCase.Execute(projectId);
            if (result.IsSuccess)
            {
                logger.LogInformation("Backlog retrieved successfully: {ProjectId}, count: {Count}", 
                    projectId, result.Value.Count);
                return Ok(result.Value);
            }
            logger.LogWarning("Failed to get backlog for project {ProjectId}: {Error}", projectId, result.Error);
            return BadRequest(result.Error);
        }

        [HttpPut("{projectId}")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(UpdateBacklogError), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> Update(Guid projectId, [FromBody] List<WorkDto> dtos, [FromServices] UpdateBacklogUseCase useCase)
        {
            var result = await useCase.Execute(projectId, dtos);
            if (result.IsSuccess)
                return Ok();
            return BadRequest(result.Error);
        }

        [HttpGet("{projectId}/export")]
        [ProducesResponseType(typeof(FileResult), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ExportBacklogError), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> Export(Guid projectId, [FromQuery] ExportType type, [FromServices] ExportBacklogUseCase useCase, [FromServices] ILogger<BacklogController> logger)
        {
            try
            {
                logger.LogInformation("Export requested for project {ProjectId}, type {Type}", projectId, type);
                var result = await useCase.Execute(projectId, type);
                if (result.IsSuccess)
                {
                    var (stream, fileName, contentType) = result.Value;
                    logger.LogInformation("Export successful: {FileName}, {ContentType}, {Length} bytes", fileName, contentType, stream.Length);
                    return File(stream, contentType, fileName);
                }
                logger.LogWarning("Export failed with error: {Error}", result.Error);
                return BadRequest(result.Error);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled exception in Export endpoint for project {ProjectId}", projectId);
                return StatusCode(500, new { error = "Internal server error", message = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }
}
