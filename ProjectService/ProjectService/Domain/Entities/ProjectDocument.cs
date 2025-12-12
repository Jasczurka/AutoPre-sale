namespace ProjectService.Domain.Entities;

public class ProjectDocument
{
    public required Guid Id { get; init; }
    public required Guid ProjectId { get; set; }
    public required string FileName { get; set; }
    public required string FileUrl { get; set; }
    public required DateTime UploadedAt { get; set; }
    public required bool Processed { get; set; }
    
    public required Project Project { get; set; }
}