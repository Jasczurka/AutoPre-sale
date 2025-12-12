import {useSidebarLayout} from "@widgets/sidebar/case/context";
import React, {type ChangeEvent, useCallback, useEffect, useRef, useState} from "react";
import {useAnalysisPageMutation, useAnalysisPageRequest} from "@pages/project_page/analysis-tz_page/request";
import type {ITableRowProps} from "@shared/components/table/interface";
import {useContextMenu} from "@widgets/context_menu/use-case";
import {useModal} from "@widgets/modal/use-case";
import {BacklogDeleteRowModal} from "@pages/project_page/analysis-tz_page/modal";
import type {
    IAnalysisTZResponse,
    ITableFieldPropsDto,
    ITableRowPropsDto
} from "@entities/project/analysis_tz/interface";
import {useAlert} from "@widgets/alert/use-case";
import {EAlertType} from "@shared/enum/alert";
import {useUnsavedChanges} from "@shared/routes/hooks/useUnsavedChanges";
import {useRouteBlocker} from "@shared/routes/hooks/useRouteBlocker";
import {useProjectContext} from "@entities/project/api/useContext";
import {useUploadProjectDocumentMutation} from "@entities/project/api/query";
import type {IProjectDocumentDto} from "@entities/project/interface/dto";
import Icon from "@mdi/react";
import {ICON_PATH} from "@shared/components/images/icons";


const ALLOWED_FILE_TYPES = ['.doc', '.docx', '.pdf'];
const ALLOWED_MIME_TYPES = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf'
];

const useAnalysisTZPagePresenter = () => {
    const {state: projectState} = useProjectContext()
    const {setTitle} = useSidebarLayout()
    const {
        data,
        refetch,
        isLoading: isDataLoading
    } = useAnalysisPageRequest({
        projectId: projectState.projectId,
        enabled: !!projectState.projectId
    })
    const {
        saveBacklog,
        downloadBacklog,
        isSaving,
        saveError
    } = useAnalysisPageMutation()

    const uploadDocumentMutation  = useUploadProjectDocumentMutation()

    const {showContextMenu} = useContextMenu()
    const {showModal, closeModal} = useModal()
    const {showAlert} = useAlert()

    const [haveDocument, setHaveDocument] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [tableData, setTableData] = useState<ITableRowProps[]>([]);
    const [initialData, setInitialData] = useState<ITableRowProps[]>([]);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const lastSavedDataRef = useRef<ITableRowProps[]>([]);

    // Проверка формата файла
    const isValidFileType = useCallback((file: File): boolean => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isExtensionValid = ALLOWED_FILE_TYPES.includes(fileExtension || '');
        const isMimeTypeValid = ALLOWED_MIME_TYPES.includes(file.type);

        return isExtensionValid || isMimeTypeValid;
    }, []);

    const tableRowToDto = useCallback((row: ITableRowProps): ITableRowPropsDto => {
        return {
            workNumber: row.workNumber,
            level: row.level,
            rowValues: row.rowValues as ITableFieldPropsDto[],
            children: row.children?.map(child => tableRowToDto(child)),
        }
    }, [])

    const dtoToTableRow = useCallback((dto: ITableRowPropsDto, index: number = 0): ITableRowProps => {
        return {
            rowIndex: index,
            workNumber: dto.workNumber,
            level: dto.level,
            rowValues: dto.rowValues,
            children: dto.children?.map((child, idx) => dtoToTableRow(child, idx)),
            canOpen: !!dto.children && dto.children.length > 0,
            isOpen: false,
            onRowClick: undefined,
            onCellDoubleClick: undefined,
            onContextMenu: undefined,
            onToggle: undefined,
            editingCell: null,
            editingValue: '',
            onCellEdit: undefined,
            onCellEditComplete: undefined,
            onDragStart: undefined,
            onDragOver: undefined,
            onDragLeave: undefined,
            onDrop: undefined,
            isDragOver: false,
            dropPosition: null
        };
    }, []);

    const tableDataToDto = useCallback((data: ITableRowProps[]): ITableRowPropsDto[] => {
        return data.map(row => tableRowToDto(row));
    }, [tableRowToDto]);

    const dtoToTableData = useCallback((dto: ITableRowPropsDto[]): ITableRowProps[] => {
        return dto.map((item, index) => dtoToTableRow(item, index));
    }, [dtoToTableRow]);

    // Обработка ответа с данными бэклога
    const processAnalysisResponse = useCallback((response: IAnalysisTZResponse) => {
        const hasDoc = !!(response.fileName && response.fileUrl);
        setHaveDocument(hasDoc);
        setFileName(response.fileName || null);
        setFileUrl(response.fileUrl || null);
        if (response.projectName) setTitle(response.projectName);

        if (response.backlogData && response.backlogData.length > 0) {
            const tableDataFromDto = dtoToTableData(response.backlogData);
            setInitialData(tableDataFromDto);
            setTableData(tableDataFromDto);
            lastSavedDataRef.current = tableDataFromDto;
            setHasChanges(false);
        } else {
            // Если бэклога нет, очищаем таблицу
            setInitialData([]);
            setTableData([]);
            lastSavedDataRef.current = [];
            setHasChanges(false);
        }
    }, [dtoToTableData, setTitle]);

    useEffect(() => {
        if (data) {
            processAnalysisResponse(data);
            if (data.projectName) {
                setTitle(`Анализ ТЗ - ${data.projectName}`);
            } else {
                setTitle('Анализ ТЗ');
            }
        }
    }, [data, processAnalysisResponse, setTitle]);

    // Сравнение данных для определения изменений
    const checkForChanges = useCallback((currentData: ITableRowProps[]) => {
        const currentDto = tableDataToDto(currentData);
        const lastSavedDto = tableDataToDto(lastSavedDataRef.current);

        const hasChanges = JSON.stringify(currentDto) !== JSON.stringify(lastSavedDto);
        setHasChanges(hasChanges);
        return hasChanges;
    }, [tableDataToDto]);

    // Обработчик изменений таблицы
    const handleTableDataChange = useCallback((newData: ITableRowProps[]) => {
        setTableData(newData);
        checkForChanges(newData);

        // Автосохранение через 30 секунд после изменений
        //if (autoSaveTimeoutRef.current) {
        //    clearTimeout(autoSaveTimeoutRef.current);
        //}

        //autoSaveTimeoutRef.current = setTimeout(() => {
        //    if (hasChanges) {
        //        saveChanges();
        //    }
        //}, 30000); // 30 секунд
    }, [checkForChanges]);

    // Очистка таймаута при размонтировании
    //useEffect(() => {
    //    return () => {
    //        if (autoSaveTimeoutRef.current) {
    //            clearTimeout(autoSaveTimeoutRef.current);
    //        }
    //    };
    //}, []);

    useEffect(()=>{
        console.log(tableData)
    }, [tableData]);

    // Скачивание файла
    const handleDownload = useCallback(async (format: 'xlsx' | 'csv') => {
        if (!projectState.projectId) {
            showAlert('ID проекта не найден', EAlertType.ERROR);
            return;
        }

        const downloadData = {
            projectId: projectState.projectId,
            format
        };

        const modalId = showModal({
            canClose: false,
            content: <>Подготовка файла для скачивания...</>
        });

        try {
            const blob = await downloadBacklog(downloadData);

            // Создаем ссылку для скачивания
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            // Определяем расширение и MIME тип
            const extension = format === 'csv' ? 'csv' : 'xlsx';
            //const mimeType = format === 'csv'
                //    ? 'text/csv;charset=utf-8;'
                //    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

            // Генерируем имя файла
            const date = new Date().toISOString().split('T')[0];
            a.download = `backlog_${projectState.projectId}_${date}.${extension}`;

            document.body.appendChild(a);
            a.click();

            // Очистка
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            showAlert(`Бэклог успешно экспортирован в формате ${format.toUpperCase()}`, EAlertType.SUCCESS);

        } catch (error) {
            console.error('Error during download:', error);
            showAlert(
                `Ошибка при скачивании: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                EAlertType.ERROR
            );
        } finally {
            closeModal(modalId);
        }
    }, [projectState.projectId, downloadBacklog, showModal, showAlert, closeModal]);


    const downloadHandle = useCallback((e: React.MouseEvent) => {
        showContextMenu({
            items: [
                {
                    id: "xlsx",
                    label: "XLSX",
                    onClick: () => handleDownload('xlsx')
                },{
                    id: "CSV",
                    label: "csv",
                    onClick: () => handleDownload('csv')
                }
            ],
            position: {
                x: e.clientX,
                y: e.clientY
            }
        })
    }, [handleDownload, showContextMenu])


    const deleteRowHandle = useCallback(() => {
        showModal(BacklogDeleteRowModal())
    }, [showModal])

    // Загрузка файла ТЗ с использованием репозитория
    const handleUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const file = e.target.files?.[0] ?? null;

        if (!file) return;

        if (!isValidFileType(file)) {
            showAlert('Неподдерживаемый формат файла. Поддерживаются: PDF, DOC, DOCX', EAlertType.WARNING);
            return;
        }

        if (!projectState.projectId) {
            showAlert('ID проекта не найден', EAlertType.ERROR);
            return;
        }

        const modalId = showModal({
            canClose: false,
            content: <div className={'flex flex-col'}>
                <Icon path={ICON_PATH.PROGRESS_ACTIVITY} size={3} spin/>
                Загрузка и анализ файла...
            </div>
        });

        try {
            setIsProcessing(true);

            // Используем мутацию загрузки документа проекта
            const documentData: IProjectDocumentDto = await uploadDocumentMutation.mutateAsync({
                projectId: projectState.projectId,
                file
            });

            showAlert('Файл успешно загружен!', EAlertType.SUCCESS);

            // Обновляем состояние с информацией о документе
            setFileName(documentData.fileName);
            setFileUrl(documentData.fileUrl);
            setHaveDocument(true);

            // Если документ обработан (processed: true), можем запросить бэклог
            if (documentData.processed) {
                showAlert('Файл обработан. Запрашиваем сформированный бэклог...', EAlertType.INFO);

                // Обновляем данные анализа (бэклог должен быть сгенерирован на сервере)
                await refetch();

                // Показываем информацию о том, что бэклог может быть сгенерирован
                // В реальном приложении здесь может быть опрос статуса или уведомление
                setTimeout(() => {
                    showAlert('Проверьте сформированный бэклог. Возможно потребуется ручная корректировка.', EAlertType.INFO);
                }, 2000);
            } else {
                showAlert('Файл загружен, но еще не обработан. Бэклог будет сформирован позже.', EAlertType.WARNING);
            }

        } catch (error) {
            console.error('Error during file upload:', error);
            showAlert(
                `Ошибка при загрузке файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                EAlertType.ERROR
            );
        } finally {
            closeModal(modalId);
            setIsProcessing(false);
        }
    }, [
        isValidFileType,
        showModal,
        showAlert,
        projectState.projectId,
        uploadDocumentMutation,
        refetch,
        closeModal
    ]);


    // Сохранение изменений с использованием репозитория
    const saveChanges = useCallback(async () => {
        if (!hasChanges || isSaving || !projectState.projectId) return;

        setIsProcessing(true);

        try {
            const backlogDataDto = tableDataToDto(tableData);
            const saveData = {
                projectId: projectState.projectId,
                backlogData: backlogDataDto
            };

            const response = await saveBacklog(saveData);

            if (response.status === "OK") {
                lastSavedDataRef.current = [...tableData];
                setHasChanges(false);
                showAlert('Изменения успешно сохранены', EAlertType.SUCCESS);

                // Обновляем данные после сохранения
                await refetch();
            } else {
                showAlert(`Ошибка сохранения: ${response.message}`, EAlertType.ERROR);
            }
        } catch (error) {
            console.error('Error during save:', error);
            showAlert(
                `Ошибка при сохранении: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                EAlertType.ERROR
            );
        } finally {
            setIsProcessing(false);
        }
    }, [hasChanges, isSaving, projectState.projectId, tableDataToDto, tableData, saveBacklog, showAlert, refetch]);
    //useNavigationBlocker(hasChanges)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                e.stopPropagation();
                saveChanges();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [saveChanges]);

    useUnsavedChanges(hasChanges)
    useRouteBlocker(hasChanges)


    return {
        haveDoc: haveDocument,
        fileName,
        fileUrl,
        initialTableData: initialData,
        tableData,
        updateTableData: handleTableDataChange,
        downloadHandle,
        deleteRowHandle,
        handleUpload,
        hasChanges,
        isSaving: isSaving || isProcessing,
        isUploading: uploadDocumentMutation.isPending,
        saveChanges,
        allowedFileTypes: ALLOWED_FILE_TYPES,
        isLoading: isDataLoading || uploadDocumentMutation.isPending,
        uploadError: uploadDocumentMutation.error,
        saveError,
        documentUploadStatus: uploadDocumentMutation.status
    }
}

export { useAnalysisTZPagePresenter }