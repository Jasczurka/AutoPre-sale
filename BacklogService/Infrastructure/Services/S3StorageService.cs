using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using BacklogService.Application.Common;

namespace BacklogService.Infrastructure.Services;

public class S3StorageService : IStorageService
{
    private readonly AmazonS3Client _s3Client;
    private readonly string _bucketName;

    public S3StorageService(string serviceUrl, string region, string accessKey, string secretKey, string bucketName)
    {
        var config = new AmazonS3Config
        {
            ServiceURL = serviceUrl,
            RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(region)
        };
        var credentials = new BasicAWSCredentials(accessKey, secretKey);
        _s3Client = new AmazonS3Client(credentials, config);
        _bucketName = bucketName;
    }

    public async Task<string> UploadFileAsync(Stream stream, string key, string contentType, CancellationToken ct = default)
    {
        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = stream,
            ContentType = contentType,
            CannedACL = S3CannedACL.PublicRead
        };

        await _s3Client.PutObjectAsync(request, ct);

        return $"https://s3.yandexcloud.net/{_bucketName}/{key}";
    }
}
