import type {IUserDto} from "@entities/user/auth/interface/dto";

interface IAuthState {
    isAuthenticated: boolean;
    user: IUserDto | null;
    setAuthData: (authData: IUserDto | null) => void;
    logout: () => void;
    isLoading: boolean;
}

export type { IAuthState };