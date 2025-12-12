import {useMutation, type UseMutationResult} from "@tanstack/react-query";
import {AuthRepository} from "@entities/user/auth/api/repository/AuthRepository.ts";
import {HTTP_APP_SERVICE} from "@shared/services/http/HttpAppService.ts";
import {useAuth} from "@entities/user/auth/context/useAuth.ts";
import {router} from "@app/routes";
import ERouterPath from "@shared/routes";
import {EMutationKeys} from "@shared/enum/query";

type IUseSignOutRequestResult = UseMutationResult<
    void,
    Error,
    void,
    unknown
>

const repository = new AuthRepository(HTTP_APP_SERVICE);

const useSignOutRequest = (): IUseSignOutRequestResult => {
    const { logout } = useAuth();

    const callback = async (): Promise<void> => {
        return repository.signOut();
    };

    const handleOnSuccess = async (): Promise<void> => {
        try {
            logout()

            // Инвалидируем роутер и перенаправляем на страницу авторизации
            await router.invalidate();
            await router.navigate({
                to: ERouterPath.AUTHORIZATION_PAGE as string
            });
        } catch (error) {
            console.error('Error during sign out cleanup:', error);
        }
    };

    const handleOnError = (error: Error): void => {
        console.error('Sign out error:', error);
        logout();

        // Все равно перенаправляем на страницу авторизации
        router.navigate({
            to: ERouterPath.AUTHORIZATION_PAGE as string
        }).then();
    };

    return useMutation({
        mutationKey: [EMutationKeys.SIGN_OUT],
        mutationFn: callback,
        onSuccess: handleOnSuccess,
        onError: handleOnError,
    });

}

export {useSignOutRequest}