import type {IGetMeDto, IRefreshResponse, IRegisterDto, ISignInDto} from "@entities/user/auth/interface/dto";
import type {IRefreshPort, IRegisterPort, ISignInPort} from "@entities/user/auth/interface/port";

interface IAuthRepository {
    getMe(): Promise<IGetMeDto>
    register(port: IRegisterPort): Promise<IRegisterDto>
    signIn(port: ISignInPort): Promise<ISignInDto>
    refreshToken(port: IRefreshPort): Promise<IRefreshResponse>
    signOut(): Promise<void>
}

export type {IAuthRepository}