import {AuthRepository} from "@entities/user/auth/api/repository/AuthRepository.ts";
import {HTTP_APP_SERVICE} from "@shared/services/http/HttpAppService.ts";
import {useMutation} from "@tanstack/react-query";
import {EMutationKeys} from "@shared/enum/query";
import type {IUseRegisterRequestResult} from "@entities/user/auth/interface/requestResult";
import {useAuth} from "@entities/user/auth/context/useAuth";
import type {IRegisterPort} from "@entities/user/auth/interface/port";
import {isEmpty} from "es-toolkit/compat";
import type {IRegisterDto} from "@entities/user/auth/interface/dto";
import {router} from "@app/routes";
import ERouterPath from "@shared/routes";


const repository = new AuthRepository(HTTP_APP_SERVICE);

const useRegistrationRequest = (): IUseRegisterRequestResult => {
    const { setAuthData } = useAuth()

    const callback = async (port: IRegisterPort) => {
        return repository.register(port)
    }

    const handleOnSuccess = async (data: IRegisterDto) => {
        if (data && !isEmpty(data.user)){
            setAuthData(data.user);
            await router.invalidate();
            await router.navigate({
                to: ERouterPath.PROJECTS_PAGE
            })
        }
    }

    const handleOnError = () => {
        //setAuthData(null)
    }

    return useMutation({
        mutationKey: [EMutationKeys.REGISTER],
        mutationFn: callback,
        onSuccess: handleOnSuccess,
        onError: handleOnError
    })
}

export { useRegistrationRequest };