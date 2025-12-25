using Confluent.Kafka;
using Microsoft.EntityFrameworkCore;
using ProjectService.Infrastructure.Data;
using System.Text.Json;

namespace ProjectService.Infrastructure.Services;

/// <summary>
/// Kafka consumer для обработки событий об ошибках анализа документов
/// </summary>
public class AnalysisFailedConsumer : BackgroundService
{
    private readonly ILogger<AnalysisFailedConsumer> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly string _bootstrapServers;
    private readonly string _topic;
    private readonly string _consumerGroup;
    private readonly ProjectEventHub _eventHub;

    public AnalysisFailedConsumer(
        ILogger<AnalysisFailedConsumer> logger,
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ProjectEventHub eventHub)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _eventHub = eventHub;
        _bootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") 
            ?? throw new InvalidOperationException("KAFKA_BOOTSTRAP_SERVERS is required");
        _topic = Environment.GetEnvironmentVariable("KAFKA_TOPIC_ANALYSIS_FAILED") ?? "analysis-failed";
        _consumerGroup = Environment.GetEnvironmentVariable("KAFKA_CONSUMER_GROUP") ?? "project-service-group";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();
        
        var config = new ConsumerConfig
        {
            BootstrapServers = _bootstrapServers,
            GroupId = _consumerGroup,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = true
        };

        using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
        consumer.Subscribe(_topic);

        _logger.LogInformation("AnalysisFailedConsumer started, listening to topic: {Topic}", _topic);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var consumeResult = consumer.Consume(stoppingToken);
                    var message = consumeResult.Message.Value;
                    
                    _logger.LogInformation("Received AnalysisFailed event: {Message}", message);

                    await ProcessAnalysisFailedEvent(message);
                }
                catch (ConsumeException ex)
                {
                    _logger.LogError(ex, "Error consuming message from Kafka");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing AnalysisFailed event");
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("AnalysisFailedConsumer is stopping");
        }
        finally
        {
            consumer.Close();
        }
    }

    private async Task ProcessAnalysisFailedEvent(string messageJson)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Используем JsonSerializerOptions для поддержки snake_case
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        var eventData = JsonSerializer.Deserialize<AnalysisFailedEvent>(messageJson, options);
        if (eventData == null)
        {
            _logger.LogWarning("Failed to deserialize AnalysisFailed event");
            return;
        }

        // Безопасный парсинг GUID
        if (!Guid.TryParse(eventData.ProjectId, out var projectId))
        {
            _logger.LogError("Invalid ProjectId format: {ProjectId}", eventData.ProjectId);
            return;
        }

        if (!Guid.TryParse(eventData.AnalysisId, out var analysisId))
        {
            _logger.LogError("Invalid AnalysisId format: {AnalysisId}", eventData.AnalysisId);
            return;
        }

        _logger.LogWarning("Processing AnalysisFailed for project {ProjectId}, analysis {AnalysisId}, error: {Error}", 
            projectId, analysisId, eventData.Error);

        // Найти или создать AnalysisResult со статусом Failed
        var analysisResult = await dbContext.AnalysisResults
            .FirstOrDefaultAsync(a => a.Id == analysisId);

        if (analysisResult == null)
        {
            _logger.LogWarning("AnalysisResult not found for ID {AnalysisId}, creating new one with Failed status", analysisId);
            analysisResult = new Domain.Entities.AnalysisResult
            {
                Id = analysisId,
                ProjectId = projectId,
                Status = Domain.Enums.AnalysisStatus.Failed,
                StartedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
                ErrorMessage = eventData.Error,
                Project = null! // Will be set by EF
            };
            dbContext.AnalysisResults.Add(analysisResult);
        }
        else
        {
            analysisResult.Status = Domain.Enums.AnalysisStatus.Failed;
            analysisResult.CompletedAt = DateTime.UtcNow;
            analysisResult.ErrorMessage = eventData.Error;
        }

        await dbContext.SaveChangesAsync();
        _logger.LogInformation("AnalysisResult updated with Failed status for project {ProjectId}", projectId);

        // Уведомляем подписчиков через SSE об ошибке анализа
        await _eventHub.NotifyAnalysisFailed(projectId, eventData.Error ?? "Unknown error");
    }

    private class AnalysisFailedEvent
    {
        public string ProjectId { get; set; } = string.Empty;
        public string AnalysisId { get; set; } = string.Empty;
        public string? Error { get; set; }
    }
}
