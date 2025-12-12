using System.IO;

namespace BacklogService.Application.Common;

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream stream, string key, string contentType, CancellationToken ct = default);
}
