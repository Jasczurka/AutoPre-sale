using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using ProjectService.Infrastructure.Data;
using ProjectService.Infrastructure.Services.JWT;
using ProjectService.Application.UseCases;
using ProjectService.Domain.Repositories;
using ProjectService.Infrastructure.Repositories;
using ProjectService.Application.Common;
using ProjectService.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();
builder.Services.ConfigureOptions<ConfigureJwtOptions>();

builder.Services.AddControllers()
    .AddJsonOptions(options => { options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()); });
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
builder.Services.AddScoped<CreateProjectUseCase>();
builder.Services.AddScoped<GetProjectsUseCase>();
builder.Services.AddScoped<GetProjectByIdUseCase>();
builder.Services.AddScoped<UploadProjectDocumentUseCase>();
builder.Services.AddScoped<UpdateProjectUseCase>();
builder.Services.AddScoped<DeleteProjectUseCase>();

// MinIO Configuration
var minioEndpoint = Environment.GetEnvironmentVariable("MINIO_ENDPOINT") ?? throw new InvalidOperationException("MINIO_ENDPOINT is required");
var minioAccessKey = Environment.GetEnvironmentVariable("MINIO_ACCESS_KEY") ?? throw new InvalidOperationException("MINIO_ACCESS_KEY is required");
var minioSecretKey = Environment.GetEnvironmentVariable("MINIO_SECRET_KEY") ?? throw new InvalidOperationException("MINIO_SECRET_KEY is required");
var minioBucket = Environment.GetEnvironmentVariable("MINIO_BUCKET_NAME") ?? throw new InvalidOperationException("MINIO_BUCKET_NAME is required");
var minioSecure = bool.Parse(Environment.GetEnvironmentVariable("MINIO_SECURE") ?? "false");

builder.Services.AddSingleton<IStorageService>(sp => new MinIOStorageService(minioEndpoint, minioAccessKey, minioSecretKey, minioBucket, minioSecure));

// Kafka Configuration
var kafkaBootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? throw new InvalidOperationException("KAFKA_BOOTSTRAP_SERVERS is required");
var kafkaTopicFileUploaded = Environment.GetEnvironmentVariable("KAFKA_TOPIC_FILE_UPLOADED") ?? "file-uploaded";

builder.Services.AddSingleton<IEventBusService>(sp => new KafkaEventBusService(kafkaBootstrapServers, kafkaTopicFileUploaded));

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
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
