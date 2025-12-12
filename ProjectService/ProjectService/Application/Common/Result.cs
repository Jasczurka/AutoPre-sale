
namespace ProjectService.Application.Common;

public sealed class Result<T, TError> where TError : IError
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public TError? Error { get; }

    private Result(bool isSuccess, T? value, TError? error)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
    }

    public static Result<T, TError> Success(T value) => new(true, value, default);
    public static Result<T, TError> Fail(TError error) => new(false, default, error);
}
