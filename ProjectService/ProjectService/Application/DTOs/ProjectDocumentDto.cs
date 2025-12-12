namespace ProjectService.Application.DTOs;

public class ProjectDocumentDto
{
    public Guid Id { get; set; }
    public required string FileName { get; set; }
    public required string FileUrl { get; set; }
    public DateTime UploadedAt { get; set; }
    public bool Processed { get; set; }
}
