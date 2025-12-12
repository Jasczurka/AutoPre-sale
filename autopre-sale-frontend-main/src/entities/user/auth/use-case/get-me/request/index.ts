import {AuthRepository} from "@entities/user/auth/api/repository/AuthRepository.ts";
import {HTTP_APP_SERVICE} from "@shared/services/http/HttpAppService.ts";
import {useQuery, type UseQueryResult} from "@tanstack/react-query";
import {EQueryKeys} from "@shared/enum/query";
import type {IGetMeDto} from "@entities/user/auth/interface/dto";
import {ELocalStorageKeys} from "@shared/enum/storage";
import ERouterPath from "@shared/routes";


type IGetMeRequestResult = UseQueryResult<IGetMeDto, Error>

interface IGetMeRequestOptions {
    enabled?: boolean
}

const repository = new AuthRepository(HTTP_APP_SERVICE);

function useGetMeRequest({
    enabled = false,
}: IGetMeRequestOptions = {}) : IGetMeRequestResult {
    const callback = async () => {
        try {
            return repository.getMe()
        } catch (error) {
            if (error?.status === 401 || error?.message?.includes('accessToken')) {
                localStorage.removeItem(ELocalStorageKeys.AUTH_TOKEN);
                window.location.href = ERouterPath.AUTHORIZATION_PAGE;
            }
            throw error;
        }

    }
    return useQuery({
        queryKey: [EQueryKeys.GET_ME],
        queryFn: callback,
        enabled,
        //staleTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: 1,
    })
}

export { useGetMeRequest };