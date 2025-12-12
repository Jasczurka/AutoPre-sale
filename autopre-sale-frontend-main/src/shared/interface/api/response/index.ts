import type {IUserDto} from "@entities/user/auth/interface/dto";

interface IGetMeResponse {
    user: IUserDto | null;
}

export type {IGetMeResponse};