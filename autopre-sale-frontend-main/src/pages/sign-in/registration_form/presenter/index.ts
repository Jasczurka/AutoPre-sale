import {useAppForm} from "@shared/lib/form";
import {useRegistrationRequest} from "@entities/user/auth/use-case/registration/request";
import {registrationSchema} from "@pages/sign-in/registration_form/schema";
import {useNavigate} from "@tanstack/react-router";
import ERouterPath from "@shared/routes";

interface IRegisterFormValues {
    firstName: string
    lastName: string
    middleName: string
    email: string
    password: string
    confirmPassword: string
}

interface IRegisterFormSubmitProps {
    value: IRegisterFormValues
}

const useRegistrationFormPresenter = () => {
    //const router = useRouter();
    const navigate = useNavigate();
    const { mutateAsync } = useRegistrationRequest()

    const handleSubmit = async ({value}: IRegisterFormSubmitProps) => {
        await mutateAsync(value, {
            onSuccess: () => {
                navigate({to: ERouterPath.PROJECTS_PAGE})
            },
            onError: () => {
            }
        })
    }

    const form = useAppForm({
        validators: {onBlur: registrationSchema},
        onSubmit: handleSubmit
    })

    return {
        form
    }
}

export { useRegistrationFormPresenter }