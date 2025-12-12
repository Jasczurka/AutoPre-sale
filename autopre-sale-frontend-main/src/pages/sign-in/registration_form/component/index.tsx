import {useRegistrationFormPresenter} from "@pages/sign-in/registration_form/presenter";
import {type FormEvent} from "react";

const RegistrationForm = () => {
    const {
        form
    } = useRegistrationFormPresenter()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        await form.handleSubmit()
    }

    return (
        <form onSubmit={handleSubmit} className={'flex flex-col gap-[40px]'}>
            <div className={'w-full flex flex-col gap-[20px]'}>
                <form.AppField name={'firstName'}>
                    {(field) => (
                        <field.TextField
                            type={'text'}
                            placeholder={'Имя'}
                        />
                    )}
                </form.AppField>
                <form.AppField name={'lastName'}>
                    {(field) => (
                        <field.TextField
                            type={'text'}
                            placeholder={'Фамилия'}
                        />
                    )}
                </form.AppField>
                <form.AppField name={'middleName'}>
                    {(field) => (
                        <field.TextField
                            type={'text'}
                            placeholder={'Отчество'}
                        />
                    )}
                </form.AppField>
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
                            placeholder={'Пароль'}
                        />
                    )}
                </form.AppField>
                <form.AppField name={'confirmPassword'}>
                    {(field) => (
                        <field.TextField
                            type={'password'}
                            placeholder={'Подтвердить пароль'}
                        />
                    )}
                </form.AppField>
            </div>

            <form.AppForm>
                <form.SubscribeButton>
                    Зарегистрироваться
                </form.SubscribeButton>
            </form.AppForm>
        </form>
    )
}

export {RegistrationForm}