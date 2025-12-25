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
            var beArgs = new BucketExistsArgs()
                .WithBucket(_bucketName);
            bool found = await _minioClient.BucketExistsAsync(beArgs);
            if (!found)
            {
                var mbArgs = new MakeBucketArgs()
                    .WithBucket(_bucketName);
                await _minioClient.MakeBucketAsync(mbArgs);
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
        
        var putObjectArgs = new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(key)
            .WithStreamData(streamToUse)
            .WithObjectSize(length)
            .WithContentType(contentType);
        
        await _minioClient.PutObjectAsync(putObjectArgs, ct);
        
        // Формируем URL для доступа к файлу
        var url = $"http://{_endpoint}/{_bucketName}/{key}";
        return url;
    }

    public async Task<Stream> DownloadFileAsync(string key, CancellationToken ct = default)
    {
        try
        {
            var memoryStream = new MemoryStream();
            
            var getObjectArgs = new GetObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(key)
                .WithCallbackStream(async (stream) =>
                {
                    await stream.CopyToAsync(memoryStream, ct);
                });
            
            await _minioClient.GetObjectAsync(getObjectArgs, ct);
            
            memoryStream.Position = 0;
            return memoryStream;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to download file from MinIO: {ex.Message}", ex);
        }
    }

    public async Task DeleteFileAsync(string key, CancellationToken ct = default)
    {
        try
        {
            var args = new RemoveObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(key);
            await _minioClient.RemoveObjectAsync(args, ct);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to delete file from MinIO: {ex.Message}", ex);
        }
    }
}
