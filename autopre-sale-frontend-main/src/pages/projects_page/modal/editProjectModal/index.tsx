import {useAlert} from "@widgets/alert/use-case";
import React, {useCallback, useMemo} from "react";
import {useAppForm} from "@shared/lib/form";
import {editProjectSchema} from "@pages/projects_page/schema";
import {Button} from "@shared/components/form/button";
import type {IProjectDto} from "@entities/project/interface/dto";
import {useModal} from "@widgets/modal/use-case";
import {useEditProjectMutation} from "@entities/project/api/query";
import {EAlertType} from "@shared/enum/alert";

interface IFormSubmitProps {
    value: {
        projectName: string;
        clientName: string;
        projectDescription?: string;
    }
}

interface IEditProjectModal {
    project: IProjectDto;
}

const EditProjectModal = ({project}: IEditProjectModal) => {
    const {showAlert} = useAlert()
    const {closeAllModals} = useModal()
    const {mutate} = useEditProjectMutation()

    const handleSubmit = useCallback(({value}:IFormSubmitProps)=>{
        mutate({
            id: project.id,
            name: value.projectName,
            clientName: value.clientName,
            status: project.status,
            description: value.projectDescription,
        }, {
            onSuccess: (editedProject) => {
                showAlert(`Проект '${editedProject.name}' отредактирован`, EAlertType.SUCCESS)
                closeAllModals()
            },
            onError: (error) => {
                showAlert(`Ошибка при изменении проекта: ${error.message}`, EAlertType.ERROR)
            }
        })
    }, [closeAllModals, mutate, project, showAlert])

    const defaultValues = useMemo(() => {
        return{
            projectName: project.name,
            clientName: project.clientName,
            projectDescription: project.description,
        }
    }, [project])

    const form = useAppForm({
        validators: { onBlur: editProjectSchema},
        defaultValues,
        onSubmit: handleSubmit
    })

    const onSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        form.handleSubmit()
    }, [form])

    return (
        <form className="flex flex-col gap-6 p-1" onSubmit={onSubmit}>
            <form.AppField name={'projectName'}>
                {(field) => (
                    <field.TextField
                        label={'Название проекта'}
                        placeholder={project.name}
                        autoFocus
                    />
                )}
            </form.AppField>
            <form.AppField name={'clientName'}>
                {(field) => (
                    <field.TextField
                        label={'Клиент'}
                        placeholder="Введите имя клиента"
                        required
                    />
                )}
            </form.AppField>
            <form.AppField name={'projectDescription'}>
                {(field) => (
                    <field.TextareaField
                        label={'Описание проекта'}
                        placeholder={project.description}
                    />
                )}
            </form.AppField>

            <div className="flex justify-between gap-3 pt-4">
                <Button
                    type="button"
                    onClick={closeAllModals}
                    outline
                >
                    Отмена
                </Button>
                <form.AppForm>
                    <form.SubscribeButton>
                        Сохранить
                    </form.SubscribeButton>
                </form.AppForm>
            </div>
        </form>
    )

}

export {EditProjectModal}