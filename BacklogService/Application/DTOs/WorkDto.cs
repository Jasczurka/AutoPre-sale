namespace BacklogService.Application.DTOs;

public class WorkDto
{
    public Guid Id { get; set; }
    public string WorkNumber { get; set; }
    public int Level { get; set; }
    public string WorkType { get; set; }
    public string? AcceptanceCriteria { get; set; }

    public List<WorkDto>? ChildWorks { get; set; }
}
