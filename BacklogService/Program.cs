using System.Text.Json.Serialization;
using BacklogService.Application.Common;
using BacklogService.Application.UseCases;
using BacklogService.Domain.Repositories;
using BacklogService.Infrastructure.Data;
using BacklogService.Infrastructure.Repositories;
using BacklogService.Infrastructure.Services;
using BacklogService.Infrastructure.Services.JWT;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();
builder.Services.ConfigureOptions<ConfigureJwtOptions>();

builder.Services.AddControllers()
    .AddJsonOptions(options => { options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()); });

builder.Services.AddScoped<IWorkRepository, WorkRepository>();
builder.Services.AddScoped<GetBacklogUseCase>();
builder.Services.AddScoped<ImportBacklogUseCase>();
builder.Services.AddScoped<UpdateBacklogUseCase>();
builder.Services.AddScoped<ExportBacklogUseCase>();

// MinIO Configuration
var minioEndpoint = Environment.GetEnvironmentVariable("MINIO_ENDPOINT") ?? throw new InvalidOperationException("MINIO_ENDPOINT is required");
var minioAccessKey = Environment.GetEnvironmentVariable("MINIO_ACCESS_KEY") ?? throw new InvalidOperationException("MINIO_ACCESS_KEY is required");
var minioSecretKey = Environment.GetEnvironmentVariable("MINIO_SECRET_KEY") ?? throw new InvalidOperationException("MINIO_SECRET_KEY is required");
var minioBucket = Environment.GetEnvironmentVariable("MINIO_BUCKET_NAME") ?? throw new InvalidOperationException("MINIO_BUCKET_NAME is required");
var minioSecure = bool.Parse(Environment.GetEnvironmentVariable("MINIO_SECURE") ?? "false");

builder.Services.AddSingleton<IStorageService>(sp => new MinIOStorageService(minioEndpoint, minioAccessKey, minioSecretKey, minioBucket, minioSecure));

// Kafka Configuration
var kafkaBootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? throw new InvalidOperationException("KAFKA_BOOTSTRAP_SERVERS is required");
var kafkaTopicBacklogReady = Environment.GetEnvironmentVariable("KAFKA_TOPIC_BACKLOG_READY") ?? "backlog-ready";
var kafkaConsumerGroup = Environment.GetEnvironmentVariable("KAFKA_CONSUMER_GROUP") ?? "backlog-service";

builder.Services.AddSingleton<IBacklogEventConsumer>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<KafkaBacklogEventConsumer>>();
    return new KafkaBacklogEventConsumer(
        kafkaBootstrapServers,
        kafkaTopicBacklogReady,
        kafkaConsumerGroup,
        sp,
        logger);
});

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Запускаем Kafka consumer
var consumer = app.Services.GetRequiredService<IBacklogEventConsumer>();
var cancellationTokenSource = new CancellationTokenSource();
var consumingTask = consumer.StartConsumingAsync(cancellationTokenSource.Token);

// Обработка завершения приложения
var appLifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
appLifetime.ApplicationStopping.Register(() =>
{
    cancellationTokenSource.Cancel();
    consumer.Stop();
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
