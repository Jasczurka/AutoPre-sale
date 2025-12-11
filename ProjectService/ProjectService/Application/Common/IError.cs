namespace ProjectService.Application.Common;

public interface IError
{
    string Code { get; }
    string Message { get; }
}
