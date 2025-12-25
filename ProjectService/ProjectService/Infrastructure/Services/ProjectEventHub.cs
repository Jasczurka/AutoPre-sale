using System.Collections.Concurrent;
using System.Text;

namespace ProjectService.Infrastructure.Services;

/// <summary>
/// Управление Server-Sent Events (SSE) подписками для проектов.
/// Позволяет отправлять real-time уведомления клиентам о статусе анализа.
/// </summary>
public class ProjectEventHub
{
    private readonly ConcurrentDictionary<Guid, List<StreamWriter>> _subscribers = new();
    private readonly ILogger<ProjectEventHub> _logger;

    public ProjectEventHub(ILogger<ProjectEventHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Подписать клиента на события проекта
    /// </summary>
    public void Subscribe(Guid projectId, StreamWriter writer)
    {
        var subscribers = _subscribers.GetOrAdd(projectId, _ => new List<StreamWriter>());
        lock (subscribers)
        {
            subscribers.Add(writer);
        }
        _logger.LogInformation("Client subscribed to project {ProjectId} events. Total subscribers: {Count}", 
            projectId, subscribers.Count);
    }

    /// <summary>
    /// Отписать клиента от событий проекта
    /// </summary>
    public void Unsubscribe(Guid projectId, StreamWriter writer)
    {
        if (_subscribers.TryGetValue(projectId, out var subscribers))
        {
            lock (subscribers)
            {
                subscribers.Remove(writer);
                _logger.LogInformation("Client unsubscribed from project {ProjectId} events. Remaining subscribers: {Count}", 
                    projectId, subscribers.Count);

                // Очищаем список, если больше нет подписчиков
                if (subscribers.Count == 0)
                {
                    _subscribers.TryRemove(projectId, out _);
                }
            }
        }
    }

    /// <summary>
    /// Уведомить всех подписчиков о завершении анализа
    /// </summary>
    public async Task NotifyAnalysisCompleted(Guid projectId)
    {
        _logger.LogInformation("Notifying subscribers about analysis completed for project {ProjectId}", projectId);
        await SendEvent(projectId, "analysis-completed", new { projectId });
    }

    /// <summary>
    /// Уведомить всех подписчиков об ошибке анализа
    /// </summary>
    public async Task NotifyAnalysisFailed(Guid projectId, string error)
    {
        _logger.LogWarning("Notifying subscribers about analysis failed for project {ProjectId}: {Error}", 
            projectId, error);
        await SendEvent(projectId, "analysis-failed", new { projectId, error });
    }

    /// <summary>
    /// Отправить SSE событие всем подписчикам проекта
    /// </summary>
    private async Task SendEvent(Guid projectId, string eventType, object data)
    {
        if (!_subscribers.TryGetValue(projectId, out var subscribers))
        {
            _logger.LogDebug("No subscribers for project {ProjectId}", projectId);
            return;
        }

        List<StreamWriter> subscribersCopy;
        lock (subscribers)
        {
            subscribersCopy = new List<StreamWriter>(subscribers);
        }

        var dataJson = System.Text.Json.JsonSerializer.Serialize(data);
        var message = $"event: {eventType}\ndata: {dataJson}\n\n";
        var disconnectedWriters = new List<StreamWriter>();

        foreach (var writer in subscribersCopy)
        {
            try
            {
                await writer.WriteAsync(message);
                await writer.FlushAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send event to subscriber for project {ProjectId}", projectId);
                disconnectedWriters.Add(writer);
            }
        }

        // Удаляем отключённых клиентов
        if (disconnectedWriters.Any())
        {
            lock (subscribers)
            {
                foreach (var writer in disconnectedWriters)
                {
                    subscribers.Remove(writer);
                }
            }
        }

        _logger.LogInformation("Sent event '{EventType}' to {Count} subscribers for project {ProjectId}", 
            eventType, subscribersCopy.Count - disconnectedWriters.Count, projectId);
    }

    /// <summary>
    /// Получить количество активных подписчиков для проекта
    /// </summary>
    public int GetSubscriberCount(Guid projectId)
    {
        if (_subscribers.TryGetValue(projectId, out var subscribers))
        {
            lock (subscribers)
            {
                return subscribers.Count;
            }
        }
        return 0;
    }
}
