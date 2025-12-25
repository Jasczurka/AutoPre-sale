using Confluent.Kafka;
using Microsoft.EntityFrameworkCore;
using ProjectService.Infrastructure.Data;
using System.Text.Json;

namespace ProjectService.Infrastructure.Services;

public class BacklogReadyConsumer : BackgroundService
{
    private readonly ILogger<BacklogReadyConsumer> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly string _bootstrapServers;
    private readonly string _topic;
    private readonly string _consumerGroup;

    public BacklogReadyConsumer(
        ILogger<BacklogReadyConsumer> logger,
        IServiceProvider serviceProvider,
        IConfiguration configuration)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _bootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") 
            ?? throw new InvalidOperationException("KAFKA_BOOTSTRAP_SERVERS is required");
        _topic = Environment.GetEnvironmentVariable("KAFKA_TOPIC_BACKLOG_READY") ?? "backlog-ready";
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

        _logger.LogInformation("BacklogReadyConsumer started, listening to topic: {Topic}", _topic);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var consumeResult = consumer.Consume(stoppingToken);
                    var message = consumeResult.Message.Value;
                    
                    _logger.LogInformation("Received BacklogReady event: {Message}", message);

                    await ProcessBacklogReadyEvent(message);
                }
                catch (ConsumeException ex)
                {
                    _logger.LogError(ex, "Error consuming message from Kafka");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing BacklogReady event");
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("BacklogReadyConsumer is stopping");
        }
        finally
        {
            consumer.Close();
        }
    }

    private async Task ProcessBacklogReadyEvent(string messageJson)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var eventData = JsonSerializer.Deserialize<BacklogReadyEvent>(messageJson);
        if (eventData == null)
        {
            _logger.LogWarning("Failed to deserialize BacklogReady event");
            return;
        }

        var projectId = Guid.Parse(eventData.ProjectId);
        var analysisId = Guid.Parse(eventData.AnalysisId);

        _logger.LogInformation("Processing BacklogReady for project {ProjectId}, analysis {AnalysisId}, TKP URL: {TkpUrl}", 
            projectId, analysisId, eventData.TkpUrl);

        // Найти или создать AnalysisResult
        var analysisResult = await dbContext.AnalysisResults
            .FirstOrDefaultAsync(a => a.Id == analysisId);

        if (analysisResult == null)
        {
            _logger.LogWarning("AnalysisResult not found for ID {AnalysisId}, creating new one", analysisId);
            analysisResult = new Domain.Entities.AnalysisResult
            {
                Id = analysisId,
                ProjectId = projectId,
                Status = Domain.Enums.AnalysisStatus.Completed,
                StartedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
                TkpUrl = eventData.TkpUrl,
                Project = null! // Will be set by EF
            };
            dbContext.AnalysisResults.Add(analysisResult);
        }
        else
        {
            analysisResult.Status = Domain.Enums.AnalysisStatus.Completed;
            analysisResult.CompletedAt = DateTime.UtcNow;
            analysisResult.TkpUrl = eventData.TkpUrl;
        }

        await dbContext.SaveChangesAsync();
        _logger.LogInformation("AnalysisResult updated with TKP URL for project {ProjectId}", projectId);
    }

    private class BacklogReadyEvent
    {
        public string ProjectId { get; set; } = string.Empty;
        public string AnalysisId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? TkpUrl { get; set; }
    }
}
