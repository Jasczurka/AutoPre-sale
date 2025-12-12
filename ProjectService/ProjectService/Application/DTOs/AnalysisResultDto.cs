using ProjectService.Domain.Enums;

namespace ProjectService.Application.DTOs;

public class AnalysisResultDto
{
    public Guid Id { get; set; }
    public required AnalysisStatus Status { get; set; }
    public required DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
