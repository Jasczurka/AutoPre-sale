using Confluent.Kafka;
using System.Text.Json;

namespace ProjectService.Infrastructure.Services;

public interface IEventBusService
{
    Task PublishFileUploadedAsync(Guid projectId, string fileUrl, CancellationToken ct = default);
}

public class KafkaEventBusService : IEventBusService
{
    private readonly IProducer<string, string> _producer;
    private readonly string _topic;

    public KafkaEventBusService(string bootstrapServers, string topic)
    {
        _topic = topic;
        
        var config = new ProducerConfig
        {
            BootstrapServers = bootstrapServers,
            Acks = Acks.All,
            EnableIdempotence = true
        };
        
        _producer = new ProducerBuilder<string, string>(config).Build();
    }

    public async Task PublishFileUploadedAsync(Guid projectId, string fileUrl, CancellationToken ct = default)
    {
        var eventData = new
        {
            project_id = projectId.ToString(),
            file_url = fileUrl
        };
        
        var message = new Message<string, string>
        {
            Key = projectId.ToString(),
            Value = JsonSerializer.Serialize(eventData)
        };
        
        await _producer.ProduceAsync(_topic, message, ct);
    }

    public void Dispose()
    {
        _producer?.Dispose();
    }
}

