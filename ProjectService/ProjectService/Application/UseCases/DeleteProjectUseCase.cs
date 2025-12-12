using ProjectService.Application.Common;
using ProjectService.Application.Errors;
using ProjectService.Domain.Repositories;

namespace ProjectService.Application.UseCases;

public class DeleteProjectUseCase
{
    private readonly IProjectRepository _repo;

    public DeleteProjectUseCase(IProjectRepository repo)
    {
        _repo = repo;
    }

    public async Task<Result<Unit, DeleteProjectError>> Execute(Guid id)
    {
        var project = await _repo.GetByIdAsync(id);
        if (project == null)
            return Result<Unit, DeleteProjectError>.Fail(DeleteProjectError.NotFound);

        await _repo.DeleteAsync(id);

        return Result<Unit, DeleteProjectError>.Success(Unit.Value);
    }
}
