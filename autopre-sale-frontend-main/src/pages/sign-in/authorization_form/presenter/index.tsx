import {useAppForm} from "@shared/lib/form";
import {authPageSchema} from "@pages/sign-in/authorization_form/schema";
import type {ISignInPort} from "@entities/user/auth/interface/port";
import {useSignInRequest} from "@entities/user/auth/use-case/sing-in";
import {useNavigate} from "@tanstack/react-router";
import ERouterPath from "@shared/routes";
//import {AuthRoute} from "@app/routes";

interface IAuthFormSubmitProps {
    value: ISignInPort
}

const useAuthFormPresenter = () => {
    //const router = useRouter();
    //const { auth } = AuthRoute.useRouteContext()
    const navigate = useNavigate();
    const { mutateAsync } = useSignInRequest()

    const handleSubmit = async ({value}: IAuthFormSubmitProps) => {
        await mutateAsync(value, {
            onSuccess: () => {
                navigate({to: ERouterPath.PROJECTS_PAGE as string})
            },
            onError: () => {

            }
        })
    }

    const form = useAppForm({
        validators: {onBlur: authPageSchema},
        onSubmit: handleSubmit
    })

    return {
        form
    }
}

export { useAuthFormPresenter }