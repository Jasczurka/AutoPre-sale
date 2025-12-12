import {useMutation, type UseMutationResult} from "@tanstack/react-query";
import type {ISignInDto} from "@entities/user/auth/interface/dto";
import type {ISignInPort} from "@entities/user/auth/interface/port";
import {AuthRepository} from "@entities/user/auth/api/repository/AuthRepository.ts";
import {HTTP_APP_SERVICE} from "@shared/services/http/HttpAppService.ts";
import {useAuth} from "@entities/user/auth/context/useAuth";
import {EMutationKeys} from "@shared/enum/query";
import {isEmpty} from "es-toolkit/compat";
import {router} from "@app/routes";
import ERouterPath from "@shared/routes";

type IUseSignInRequestResult = UseMutationResult<
    ISignInDto,           // Успешный ответ
    Error,                  // Ошибка
    ISignInPort,          // Входные данные
    unknown                 // Контекст (не используем)
>

const repository = new AuthRepository(HTTP_APP_SERVICE);

const useSignInRequest = (): IUseSignInRequestResult => {
    const { setAuthData } = useAuth()

    const callback = async (port: ISignInPort) => {
        return repository.signIn(port);
    }

    const handleOnSuccess = async (data: ISignInDto) => {
        if (data && !isEmpty(data)) {
            setAuthData(data.user);
            await router.invalidate();
            await router.navigate({
                to: ERouterPath.PROJECTS_PAGE as string
            })
        }
    };

    const handleOnError = () => {
        //setAuthData(null);
    };

    return useMutation({
        mutationKey: [EMutationKeys.SIGN_IN],
        mutationFn: callback,
        onSuccess: handleOnSuccess,
        onError: handleOnError,
    });
}

export { useSignInRequest }