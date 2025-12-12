using ProjectService.Domain.Enums;

namespace ProjectService.Application.DTOs;

public class UpdateProjectRequest
{
    public required Guid Id { get; set; }
    public string? Name { get; set; }
    public string? ClientName { get; set; }
    public ProjectStatus? Status { get; set; }
    public string? Description { get; set; }
}
