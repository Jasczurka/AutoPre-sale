namespace BacklogService.Domain.Entities;

public class Work
{
    public required Guid Id { get; set; }
    public required Guid ProjectId { get; set; }
    public required string WorkNumber { get; set; }
    public required int Level { get; set; }
    public required string WorkType { get; set; }
    public string? AcceptanceCriteria { get; set; }
    public required DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public Guid? ParentId { get; set; }
    public List<Work>? ChildWorks { get; set; }
}