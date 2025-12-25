using ProjectService.Domain.Enums;

namespace ProjectService.Domain.Entities;

public class AnalysisResult
{
    public required Guid Id { get; set; }
    public required Guid ProjectId { get; set; }
    public required AnalysisStatus Status { get; set; }
    public required DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? TkpUrl { get; set; }
    public string? ErrorMessage { get; set; } // Сообщение об ошибке при Failed статусе
    
    public required Project Project { get; set; }
}