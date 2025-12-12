import {useAppForm} from "@shared/lib/form";
import {testPageSchema} from "@pages/test_page/schema";
import React, {useCallback, useEffect, useState} from "react";
import {useSidebarLayout} from "@widgets/sidebar/case/context";
import {useModal} from "@widgets/modal/use-case";
import {useContextMenu} from "@widgets/context_menu/use-case";
import {Button} from "@shared/components/form/button";
import {ICON_PATH} from "@shared/components/images/icons";
import type {IStaticTableProps} from "@shared/components/table/interface";
import {DEF_TABLE_DATA} from "@pages/test_page/const";
import {useAlert} from "@widgets/alert/use-case";
import {EAlertType} from "@shared/enum/alert";

interface IFormSubmitProps {
    value: {
        input: string;
    }
}

const useTestPagePresenter = () => {
    const {showAlert} = useAlert()
    const {setTitle} = useSidebarLayout()
    const {showModal} = useModal()
    const {showContextMenu} = useContextMenu()
    useEffect(() => {
        setTitle("Тестовая страница")
    }, [setTitle])

    const handleSubmit = useCallback(({value}: IFormSubmitProps) => {
        showAlert('Успех!', EAlertType.SUCCESS)
        showAlert(value.input as string)
        showAlert('Предупреждение!', EAlertType.WARNING)
        showAlert('Ошибка!', EAlertType.ERROR)
    }, [showAlert])

    const form = useAppForm({
        validators: {onBlur: testPageSchema},
        onSubmit: handleSubmit,
    })

    const showModalHandle = () => showModal({
        title: "Вы точно хотите удалить элемент бэклога?",
        content: (
            <div>
                <Button outline>
                    Отмена
                </Button>
                <Button>
                    Удалить
                </Button>
            </div>
        )
    })

    const showContextMenuHandel = (e: React.MouseEvent) => {
        showContextMenu({
            items: [
                {
                    id: "Add",
                    icon: ICON_PATH.ADD,
                    label: 'Добавить',
                    onClick: () => {},
                },{
                    id: 'divider',
                    divider: true,
                }, {
                    id: 'delete',
                    label: "Удалить",
                    disabled: true
                }, {
                    id: 'delete',
                    label: "Удалить",
                }
            ],
            position: {
                x: e.clientX,
                y: e.clientY
            }
        })
    }

    const [stateTableData, setStateTableData] = useState<IStaticTableProps>(DEF_TABLE_DATA)

    return {
        form,
        showModalHandle,
        showContextMenuHandel,
        stateTableData,
        setStateTableData
    }
}

export {useTestPagePresenter}