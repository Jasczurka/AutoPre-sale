using AuthService.Application.Common;
using AuthService.Application.DTOs;
using AuthService.Application.Errors;
using AuthService.Domain.Repositories;

namespace AuthService.Application.UseCases;

public class GetMeUseCase
{
    private readonly IUserRepository _userRepository;

    public GetMeUseCase(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<Result<UserDTO, GetMeError>> Execute(string userId)
    {
        var user = await _userRepository.GetUserById(userId);
        if (user == null)
            return Result<UserDTO, GetMeError>.Fail(GetMeError.UserNotFound);

        var dto = new UserDTO
        {
            Id = user.Id.ToString(),
            Email = user.Email,
            FullName = user.FullName
        };

        return Result<UserDTO, GetMeError>.Success(dto);
    }
}
