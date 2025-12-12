using Minio;
using Minio.Exceptions;
using ProjectService.Application.Common;

namespace ProjectService.Infrastructure.Services;

public class MinIOStorageService : IStorageService
{
    private readonly MinioClient _minioClient;
    private readonly string _bucketName;
    private readonly string _endpoint;

    public MinIOStorageService(string endpoint, string accessKey, string secretKey, string bucketName, bool secure = false)
    {
        _endpoint = endpoint;
        _bucketName = bucketName;
        
        // Используем Builder для создания клиента
        var builder = new MinioClient()
            .WithEndpoint(endpoint)
            .WithCredentials(accessKey, secretKey);
        
        if (secure)
        {
            builder.WithSSL();
        }
        
        _minioClient = builder.Build();
        
        // Убеждаемся, что bucket существует
        EnsureBucketExistsAsync().Wait();
    }

    private async Task EnsureBucketExistsAsync()
    {
        try
        {
            bool found = await _minioClient.BucketExistsAsync(_bucketName);
            if (!found)
            {
                await _minioClient.MakeBucketAsync(_bucketName);
            }
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to ensure bucket exists: {ex.Message}", ex);
        }
    }

    public async Task<string> UploadFileAsync(Stream stream, string key, string contentType, CancellationToken ct = default)
    {
        // MinIO требует знать размер объекта
        long length = 0;
        Stream streamToUse = stream;
        
        if (stream.CanSeek)
        {
            length = stream.Length - stream.Position;
        }
        else
        {
            // Если поток не поддерживает Seek, читаем в память
            var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream, ct);
            length = memoryStream.Length;
            memoryStream.Position = 0;
            streamToUse = memoryStream;
        }
        
        await _minioClient.PutObjectAsync(_bucketName, key, streamToUse, length, contentType);
        
        // Формируем URL для доступа к файлу
        var url = $"http://{_endpoint}/{_bucketName}/{key}";
        return url;
    }
}
