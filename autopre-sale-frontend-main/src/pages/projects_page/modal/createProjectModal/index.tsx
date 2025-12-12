import {Button} from "@shared/components/form/button";
import {useAppForm} from "@shared/lib/form";
import {createProjectSchema} from "@pages/projects_page/schema";
import {useCallback} from "react";
import {useAlert} from "@widgets/alert/use-case";
import {useModal} from "@widgets/modal/use-case";
import {useCreateProjectMutation} from "@entities/project/api/query";
import {EAlertType} from "@shared/enum/alert";

interface IFormSubmitProps {
    value: {
        projectName: string;
        clientName: string;
        projectDescription?: string;
    }
}

const CreateProjectModal = () => {
    const {showAlert} = useAlert()
    const {closeAllModals} = useModal()
    const {mutate, isPending} = useCreateProjectMutation()
    const handleSubmit = useCallback(({value}:IFormSubmitProps)=>{
        mutate({
            name: value.projectName,
            clientName: value.clientName,
            description: value.projectDescription,
        }, {
            onSuccess: (createdProject) => {
                showAlert(`Проект '${createdProject.name}' создан`, EAlertType.SUCCESS)
                closeAllModals()
            },
            onError: (error) => {
                showAlert(`Ошибка при создании проекта: ${error.message}`, EAlertType.ERROR)
            }
        })
    }, [closeAllModals, mutate, showAlert])

    const form = useAppForm({
        validators: { onBlur: createProjectSchema },
        onSubmit: handleSubmit,
    })

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit().then()
            }}
            className="flex flex-col gap-2"
        >
            <form.AppField name={'projectName'}>
                {(field) => (
                    <field.TextField
                        placeholder={'Название'}
                    />
                )}
            </form.AppField>
            <form.AppField name={'clientName'}>
                {(field) => (
                    <field.TextField
                        placeholder="Введите имя клиента"
                        required
                    />
                )}
            </form.AppField>
            <form.AppField name={'projectDescription'}>
                {(field) => (
                    <field.TextareaField
                        placeholder={'Описание'}
                    />
                )}
            </form.AppField>

            <div className="flex justify-between gap-3 pt-4">
                <Button
                    type="button"
                    onClick={closeAllModals}
                    outline
                    disabled={isPending}
                >
                    Отмена
                </Button>
                <form.AppForm>
                    <form.SubscribeButton
                        disabled={isPending}
                    >
                        {isPending ? 'Создание...' : 'Создать'}
                    </form.SubscribeButton>
                </form.AppForm>
            </div>
        </form>
    )
}

export {CreateProjectModal}