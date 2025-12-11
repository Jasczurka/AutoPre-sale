using ProjectService.Domain.Enums;

namespace ProjectService.Application.DTOs;

public class CreateProjectRequest
{
    public required string Name { get; set; }
    public required string ClientName { get; set; }
    public ProjectStatus? Status { get; set; }
    public string Description { get; set; } = string.Empty;
}
