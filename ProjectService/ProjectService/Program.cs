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

var s3ServiceUrl = Environment.GetEnvironmentVariable("S3_SERVICE_URL") ?? "https://s3.yandexcloud.net";
var s3Region = Environment.GetEnvironmentVariable("S3_REGION") ?? "ru-central1";
var s3AccessKey = Environment.GetEnvironmentVariable("S3_ACCESS_KEY") ?? throw new InvalidOperationException("S3_ACCESS_KEY is required");
var s3SecretKey = Environment.GetEnvironmentVariable("S3_SECRET_KEY") ?? throw new InvalidOperationException("S3_SECRET_KEY is required");
var s3Bucket = Environment.GetEnvironmentVariable("S3_BUCKET") ?? throw new InvalidOperationException("S3_BUCKET is required");

builder.Services.AddSingleton<IStorageService>(sp => new S3StorageService(s3ServiceUrl, s3Region, s3AccessKey, s3SecretKey, s3Bucket));

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
