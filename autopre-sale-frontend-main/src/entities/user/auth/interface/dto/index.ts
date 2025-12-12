interface IUserDto {
    id: string;
    email: string;
    fullName: string;
}

// Согласно OpenAPI, регистрация и логин возвращают разные структуры
interface IRegisterResponse {
    user: IUserDto;
    accessToken: string;
    refreshToken: string; // Добавлено согласно OpenAPI
}

interface ILoginResponse {
    user: IUserDto;
    accessToken: string;
    refreshToken: string; // Добавлено согласно OpenAPI
}

interface IRefreshResponse {
    accessToken: string;
    refreshToken: string;
}

// Ошибки согласно OpenAPI
interface IAuthError {
    code?: string;
    message?: string;
}

interface IProblemDetails {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
}

type IRegisterDto = IRegisterResponse;
type ISignInDto = ILoginResponse;
type IGetMeDto = IUserDto;

export type {
    IRegisterDto,
    IGetMeDto,
    IUserDto,
    ISignInDto,
    IRefreshResponse,
    IAuthError,
    IProblemDetails
}