import {useAuthFormPresenter} from "@pages/sign-in/authorization_form/presenter";
import type {FormEvent} from "react";

const AuthForm = () => {

    const {
        form
    } = useAuthFormPresenter()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        await form.handleSubmit()
    }

    return (
        <form onSubmit={handleSubmit} className={'flex flex-col items-center gap-[40px]'}>
            <div className={'w-full flex flex-col gap-[20px]'}>
                <form.AppField name={'email'}>
                    {(field) => (
                        <field.TextField
                            type={'email'}
                            placeholder={'Почта'}

                        />
                    )}
                </form.AppField>
                <form.AppField name={'password'}>
                    {(field) => (
                        <field.TextField
                            type={'password'}
                            placeholder={"Пароль"}
                        />
                    )}
                </form.AppField>
            </div>

            <form.AppForm>
                <form.SubscribeButton>
                    Войти
                </form.SubscribeButton>
            </form.AppForm>
        </form>
    )
}

export default AuthForm;