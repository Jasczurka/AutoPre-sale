using System.IO;

namespace ProjectService.Application.Common;

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream stream, string key, string contentType, CancellationToken ct = default);
    Task<Stream> DownloadFileAsync(string key, CancellationToken ct = default);
    Task DeleteFileAsync(string key, CancellationToken ct = default);
}
