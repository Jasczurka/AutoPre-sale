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
        public async Task<IActionResult> Get(Guid projectId, [FromServices] GetBacklogUseCase useCase)
        {
            var result = await useCase.Execute(projectId);
            if (result.IsSuccess)
                return Ok(result.Value);
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
        [ProducesResponseType(typeof(ExportResponseDto), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ExportBacklogError), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> Export(Guid projectId, [FromQuery] ExportType type, [FromServices] ExportBacklogUseCase useCase)
        {
            var result = await useCase.Execute(projectId, type);
            if (result.IsSuccess)
                return Ok(result.Value);
            return BadRequest(result.Error);
        }
    }
}
