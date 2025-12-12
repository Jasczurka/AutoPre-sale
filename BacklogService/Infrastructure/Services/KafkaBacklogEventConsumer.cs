using Confluent.Kafka;
using System.Text.Json;
using System.Text.Json.Serialization;
using BacklogService.Application.UseCases;
using BacklogService.Application.DTOs;

namespace BacklogService.Infrastructure.Services;

public interface IBacklogEventConsumer
{
    Task StartConsumingAsync(CancellationToken cancellationToken);
    void Stop();
}

public class KafkaBacklogEventConsumer : IBacklogEventConsumer, IDisposable
{
    private readonly IConsumer<string, string> _consumer;
    private readonly string _topic;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<KafkaBacklogEventConsumer> _logger;
    private Task? _consumingTask;
    private CancellationTokenSource? _cancellationTokenSource;

    public KafkaBacklogEventConsumer(
        string bootstrapServers,
        string topic,
        string consumerGroup,
        IServiceProvider serviceProvider,
        ILogger<KafkaBacklogEventConsumer> logger)
    {
        _topic = topic;
        _serviceProvider = serviceProvider;
        _logger = logger;

        var config = new ConsumerConfig
        {
            BootstrapServers = bootstrapServers,
            GroupId = consumerGroup,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = true
        };

        _consumer = new ConsumerBuilder<string, string>(config).Build();
    }

    public Task StartConsumingAsync(CancellationToken cancellationToken)
    {
        _cancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        _consumingTask = Task.Run(async () => await ConsumeMessagesAsync(_cancellationTokenSource.Token), cancellationToken);
        return Task.CompletedTask;
    }

    private async Task ConsumeMessagesAsync(CancellationToken cancellationToken)
    {
        _consumer.Subscribe(_topic);
        _logger.LogInformation("Started consuming from topic: {Topic}", _topic);

        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    var result = _consumer.Consume(TimeSpan.FromSeconds(1));
                    if (result == null) continue;

                    _logger.LogInformation("Received message from topic {Topic}, partition {Partition}, offset {Offset}",
                        result.Topic, result.Partition, result.Offset);

                    await ProcessMessageAsync(result.Message.Value, cancellationToken);
                }
                catch (ConsumeException ex)
                {
                    _logger.LogError(ex, "Error consuming message from Kafka");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error while consuming messages");
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Consuming cancelled");
        }
        finally
        {
            _consumer.Close();
        }
    }

    private async Task ProcessMessageAsync(string messageValue, CancellationToken cancellationToken)
    {
        try
        {
            var eventData = JsonSerializer.Deserialize<BacklogReadyEvent>(messageValue);
            if (eventData == null)
            {
                _logger.LogWarning("Failed to deserialize BacklogReady event");
                return;
            }

            _logger.LogInformation("Processing BacklogReady event for project {ProjectId}, analysis {AnalysisId}",
                eventData.ProjectId, eventData.AnalysisId);

            // Импортируем backlog из события
            await ImportBacklogFromEventAsync(
                Guid.Parse(eventData.ProjectId),
                eventData,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing BacklogReady event");
        }
    }

    private async Task ImportBacklogFromEventAsync(Guid projectId, BacklogReadyEvent eventData, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var importUseCase = scope.ServiceProvider.GetRequiredService<ImportBacklogUseCase>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<KafkaBacklogEventConsumer>>();

        try
        {
            if (eventData.BacklogTable == null || !eventData.BacklogTable.Any())
            {
                logger.LogWarning("Backlog is empty in event for analysis {AnalysisId}", eventData.AnalysisId);
                return;
            }

            // Преобразуем данные из события в формат ImportBacklogDto
            var importDto = new ImportBacklogDto
            {
                BacklogTable = eventData.BacklogTable.Select(item => new WorkImportItem
                {
                    WorkNumber = item.WorkNumber,
                    WorkType = item.WorkType,
                    AcceptanceCriteria = item.AcceptanceCriteria
                }).ToList()
            };

            // Импортируем backlog
            var result = await importUseCase.Execute(projectId, importDto);
            if (result.IsSuccess)
            {
                logger.LogInformation("Successfully imported backlog for project {ProjectId} with {Count} items", 
                    projectId, importDto.BacklogTable.Count);
            }
            else
            {
                logger.LogError("Failed to import backlog for project {ProjectId}: {Error}",
                    projectId, result.Error?.Message);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error importing backlog from event");
        }
    }

    public void Stop()
    {
        _cancellationTokenSource?.Cancel();
        _consumingTask?.Wait(TimeSpan.FromSeconds(5));
    }

    public void Dispose()
    {
        Stop();
        _consumer?.Dispose();
        _cancellationTokenSource?.Dispose();
    }
}

public class BacklogReadyEvent
{
    [JsonPropertyName("project_id")]
    public string ProjectId { get; set; } = string.Empty;

    [JsonPropertyName("analysis_id")]
    public string AnalysisId { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("backlog_table")]
    public List<BacklogItemDto> BacklogTable { get; set; } = new();
}

public class BacklogItemDto
{
    [JsonPropertyName("work_number")]
    public string WorkNumber { get; set; } = string.Empty;

    [JsonPropertyName("work_type")]
    public string WorkType { get; set; } = string.Empty;

    [JsonPropertyName("acceptance_criteria")]
    public string? AcceptanceCriteria { get; set; }
}

