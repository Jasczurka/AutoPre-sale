import {BaseRepository} from "@shared/api/http/BaseRepository.ts";
import type {IAuthRepository} from "../../interface/repository/IAuthRepository.ts";
import type {IGetMeDto, IRefreshResponse, IRegisterDto, ISignInDto} from "@entities/user/auth/interface/dto";
import {EAuthAPI} from "@shared/enum/query";
import type {IRefreshPort, IRegisterPort, ISignInPort} from "@entities/user/auth/interface/port";
import {ELocalStorageKeys} from "@shared/enum/storage";
import {IS_STUB as isStub}  from "@shared/api/const";
//import type {ICookieService} from "@shared/services/cookie/ICookieService.ts";
//import {CookieService} from "@shared/services/cookie/CookieService.ts";
//import {ECookieKey} from "@shared/services/cookie/ECookieKey.ts";


const stubUser: IRegisterDto = {
    user: {
        id: '1',
        email: '123@gmail.com',
        fullName: 'Иванов И.И.',
    },
    accessToken: 'stub-token',
    refreshToken: 'stub-refresh-token',
}

class AuthRepository extends BaseRepository implements IAuthRepository {
    //private readonly _cookieService: ICookieService = new CookieService();
    public async getMe(): Promise<IGetMeDto> {
        if (isStub) {
            return Promise.resolve(stubUser.user)
        }

        const token = localStorage.getItem(ELocalStorageKeys.AUTH_TOKEN);
        if (!token) {
            throw new Error('No authentication token found');
        }

        return await this._httpService.get<IGetMeDto>(EAuthAPI.GET_ME, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
    public async register(port: IRegisterPort): Promise<IRegisterDto> {
        if (isStub) {
            localStorage.setItem(ELocalStorageKeys.AUTH_TOKEN, stubUser.accessToken);
            localStorage.setItem(ELocalStorageKeys.REFRESH_TOKEN, stubUser.refreshToken);
            return Promise.resolve(stubUser);
        }
        const result = await this._httpService.post<IRegisterDto>(EAuthAPI.REGISTER, {body: {
                ...port,
                middleName: port.middleName || null
            }});

        if (result.accessToken) {
            localStorage.setItem(ELocalStorageKeys.AUTH_TOKEN, result.accessToken);
            localStorage.setItem(ELocalStorageKeys.REFRESH_TOKEN, result.refreshToken);
        }
        return result;
    }
    public async signIn(port: ISignInPort): Promise<ISignInDto> {
        if (isStub) {
            localStorage.setItem(ELocalStorageKeys.AUTH_TOKEN, stubUser.accessToken);
            localStorage.setItem(ELocalStorageKeys.REFRESH_TOKEN, stubUser.refreshToken);
            return Promise.resolve(stubUser);
        }
        const result = await this._httpService.post<ISignInDto>(EAuthAPI.SIGN_IN, { body: port });
        // Сохраняем токен после входа
        if (result.accessToken) {
            localStorage.setItem(ELocalStorageKeys.AUTH_TOKEN, result.accessToken);
            localStorage.setItem(ELocalStorageKeys.REFRESH_TOKEN, result.refreshToken);
        }
        return result;
    }

    public async refreshToken(port: IRefreshPort): Promise<IRefreshResponse> {
        if (isStub) {
            const newTokens = {
                accessToken: 'new-stub-access-token',
                refreshToken: 'new-stub-refresh-token'
            };
            localStorage.setItem(ELocalStorageKeys.AUTH_TOKEN, newTokens.accessToken);
            localStorage.setItem(ELocalStorageKeys.REFRESH_TOKEN, newTokens.refreshToken);
            return Promise.resolve(newTokens);
        }

        const result = await this._httpService.post<IRefreshResponse>(EAuthAPI.REFRESH_TOKEN, {
            body: port
        });

        if (result.accessToken && result.refreshToken) {
            localStorage.setItem(ELocalStorageKeys.AUTH_TOKEN, result.accessToken);
            localStorage.setItem(ELocalStorageKeys.REFRESH_TOKEN, result.refreshToken);
        }
        return result;
    }

    public async signOut(): Promise<void> {
        if (isStub) {
            localStorage.removeItem(ELocalStorageKeys.AUTH_TOKEN);
            localStorage.removeItem(ELocalStorageKeys.REFRESH_TOKEN);
            return Promise.resolve();
        }
        //await this._httpService.post<void>(EAuthAPI.SIGN_OUT);
        localStorage.removeItem(ELocalStorageKeys.AUTH_TOKEN);
        localStorage.removeItem(ELocalStorageKeys.REFRESH_TOKEN);
    }
}

export {AuthRepository}