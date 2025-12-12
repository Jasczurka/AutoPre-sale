using ProjectService.Domain.Enums;

namespace ProjectService.Domain.Entities;

public class Project
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required string ClientName { get; set; }
    public required ProjectStatus Status { get; set; }
    public required string Description { get; set; }
    public required DateTime CreatedAt { get; set; }
    public required DateTime UpdatedAt { get; set; }
    
    public List<ProjectDocument> Documents { get; set; } = new List<ProjectDocument>();
}