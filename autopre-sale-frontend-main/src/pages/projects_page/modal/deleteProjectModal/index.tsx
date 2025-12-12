import type {IProjectDto} from "@entities/project/interface/dto";
import {Button} from "@shared/components/form/button";
import {useModal} from "@widgets/modal/use-case";
import {useDeleteProjectMutation} from "@entities/project/api/query";
import {useAlert} from "@widgets/alert/use-case";
import {EAlertType} from "@shared/enum/alert";

interface IDeleteProjectModal {
    project: IProjectDto
}

const DeleteProjectModal = ({project}: IDeleteProjectModal) => {
    const {showAlert} = useAlert();
    const {closeAllModals} = useModal();
    const {mutate} = useDeleteProjectMutation();
    const handleDelete = () => {
        mutate(project.id,
            {
                onSuccess: () => {
                    showAlert(`Проект '${project.name}' удален`)
                    closeAllModals()
                },
                onError: (error) => {
                    showAlert(`Ошибка при удалении проекта ${project.name}. ${error.message}`, EAlertType.ERROR)
                }
            }
        )
    }

    return (
        <div className="flex flex-col gap-6 p-1">
            <div>
                <p>
                    Вы точно хотите удалить проект <b>"{project.name}"</b>?
                </p>
            </div>
            <div className="flex justify-between gap-3 pt-4">
                <Button
                    type="button"
                    onClick={closeAllModals}
                    outline
                >
                    Отмена
                </Button>
                <Button
                    type="button"
                    onClick={handleDelete}
                >
                    Удалить
                </Button>
            </div>
        </div>
    )

}

export {DeleteProjectModal}