using ProjectService.Domain.Enums;
using System.Text.Json.Serialization;

namespace ProjectService.Application.DTOs;

public class ProjectDto
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string ClientName { get; set; }
    public required ProjectStatus Status { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public ProjectDocumentDto? Document { get; set; }
    public AnalysisResultDto? AnalysisResult { get; set; }
}
