using System.Text.Json.Serialization;

namespace BacklogService.Application.DTOs;

public class ImportBacklogDto
{
    [JsonPropertyName("backlog_table")]
    public required List<WorkImportItem> BacklogTable { get; set; }
}

public class WorkImportItem
{
    [JsonPropertyName("work_number")]
    public required string WorkNumber { get; set; }

    [JsonPropertyName("work_type")]
    public required string WorkType { get; set; }

    [JsonPropertyName("acceptance_criteria")]
    public string? AcceptanceCriteria { get; set; }
}
