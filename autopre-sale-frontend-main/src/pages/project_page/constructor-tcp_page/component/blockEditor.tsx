import type {IBlockItem} from "@shared/components/constructor_tcp/block_list";
import style from "@pages/project_page/constructor-tcp_page/style/constructor.module.css";
import {Label} from "@shared/components/form/label/content";
import {Textarea} from "@shared/components/form/textarea";
import {useCallback, useEffect, useMemo, useState} from "react";
import {Input} from "@shared/components/form/input";
import {useAlert} from "@widgets/alert/use-case";
import {EAlertType} from "@shared/enum/alert";

interface IBlockEditorProps {
    activeBlock?: IBlockItem | null,
    onSave?: (blockId: string, slideId: string, updates: Partial<IBlockItem>) => void,
    onUpdate?: (blockId: string, slideId: string, fieldName: string, value: string) => void,
    activeSlideId: string | null,
}

const BlockEditor = ({
    activeBlock,
    onSave,
    activeSlideId
}: IBlockEditorProps) => {
    const {showAlert} = useAlert();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);
    const [localBlock, setLocalBlock] = useState<IBlockItem | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [showValidationErrors, setShowValidationErrors] = useState(false);

    // Функция валидации всех полей
    const validateFields = useCallback((block: IBlockItem): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (block.fields) {
            block.fields.forEach(field => {
                if (field.required) {
                    const value = field.value || '';

                    if (value.trim() === '') {
                        errors[field.id] = `Поле "${field.label}" обязательно для заполнения`;
                    }

                    // Дополнительные проверки в зависимости от типа поля
                    if (field.type === 'number' && value.trim() !== '') {
                        const numValue = parseFloat(value);
                        if (isNaN(numValue)) {
                            errors[field.id] = `Поле "${field.label}" должно быть числом`;
                        }
                    }
                }
            });
        }

        // Проверка заголовка, если есть поле с name="title"
        const titleField = block.fields?.find(f => f.name === 'title' && f.required);
        if (titleField) {
            // Если есть поле title, проверяем его
            const titleFieldValue = block.fields?.find(f => f.id === titleField.id)?.value || '';
            if (titleField.required && titleFieldValue.trim() === '') {
                errors[titleField.id] = `Поле "${titleField.label}" обязательно для заполнения`;
            }
        }

        return errors;
    }, []);

    useEffect(() => {
        if(activeBlock){
            setLocalBlock({...activeBlock})
            setHasUnsavedChanges(false);
        }
    }, [activeBlock]);
    
    const handleSave = useCallback(() => {
        if (!localBlock || !activeBlock || !onSave || !activeSlideId) return;

        const errors = validateFields(localBlock);
        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            setShowValidationErrors(true);
            showAlert('Есть ошибки в заполнении полей', EAlertType.ERROR);
            return;
        }

        const updates: Partial<IBlockItem> = {
            title: localBlock.title,
            fields: localBlock.fields?.map(field => ({
                ...field,
            }))
        }

        onSave(activeBlock.id, activeSlideId, updates);
        setHasUnsavedChanges(false);
        setShowValidationErrors(false);
        showAlert('Изменения сохранены');
    }, [activeBlock, activeSlideId, localBlock, onSave, showAlert, validateFields])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'ы')) {
                e.preventDefault();
                e.stopPropagation();
                if (hasUnsavedChanges) {
                    handleSave();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasUnsavedChanges, handleSave]);

    // Обработчик изменения title
    const handleTitleChange = useCallback((value: string) => {
        if (!localBlock) return;

        setLocalBlock(prev => prev ? {...prev, title: value} : null);
        setHasUnsavedChanges(true);

        // Если есть поле title в fields, обновляем его тоже
        const titleFieldInFields = localBlock.fields?.find(f => f.name === 'title');
        if (titleFieldInFields) {
            setLocalBlock(prev => {
                if (!prev || !prev.fields) return prev;
                return {
                    ...prev,
                    fields: prev.fields.map(field =>
                        field.name === 'title' ? {...field, value} : field
                    )
                };
            });
        }

        // Очищаем ошибку валидации
        if (validationErrors['title']) {
            setValidationErrors(prev => {
                const newErrors = {...prev};
                delete newErrors['title'];
                return newErrors;
            });
        }
    }, [localBlock, validationErrors]);

    // Обработчик изменения поля
    const handleFieldChange = useCallback((fieldId: string, value: string) => {
        if (!localBlock || !localBlock.fields) return;

        setLocalBlock(prev => {
            if (!prev) return null;

            return {
                ...prev,
                fields: prev.fields?.map(field =>
                    field.id === fieldId ? {...field, value} : field
                )
            };
        });
        setHasUnsavedChanges(true);

        // Если есть поле с именем "title", обновляем и заголовок блока
        const changedField = localBlock.fields.find(f => f.id === fieldId);
        if (changedField?.name === 'title') {
            handleTitleChange(value);
        }

        if (showValidationErrors) {
            setTimeout(() => {
                const errors = validateFields({
                    ...localBlock,
                    fields: localBlock.fields?.map(f =>
                        f.id === fieldId ? {...f, value} : f
                    )
                });
                setValidationErrors(errors);
            }, 0);
        }

        // Очищаем ошибку при вводе
        if (validationErrors[fieldId]) {
            setValidationErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    }, [localBlock, showValidationErrors, validationErrors, handleTitleChange, validateFields]);

    const titleField = useMemo(() => {
        if (!localBlock?.fields) return null;
        return localBlock.fields.find(field => field.name === 'title');
    }, [localBlock?.fields]);

    if (!activeBlock || !localBlock) return <h2>Блок не выбран</h2>;

    return (
        <>
            <div className={'inline-flex flex-col gap-2 items-center'}>
                <h2>
                    Блок "{activeBlock.title}"
                </h2>
                {hasUnsavedChanges && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit cursor-pointer" onClick={handleSave}>
                        Есть несохраненные изменения (нажмите на плашку или Ctrl+S для сохранения)
                    </span>
                )}
                {showValidationErrors && Object.keys(validationErrors).length > 0 && (
                    <div
                        className="w-full mt-2"
                    >
                        <div className="text-sm">
                            <strong>Ошибки заполнения:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                                {Object.entries(validationErrors).map(([fieldId, message]) => (
                                    <li key={fieldId}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className={style.scrollList}>
                <div className={'flex flex-col gap-5 px-1 pt-2 pb-10'}>
                    {titleField ? (
                        <div className="w-full">
                            <Label>
                                {titleField.label}
                                {titleField.required && (<span className={'text-red-600'}>*</span>)}
                            </Label>
                            <Input
                                value={localBlock.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder={titleField.placeholder || titleField.label}
                                className="w-full"
                            />
                        </div>
                    ) : (
                        <div className="w-full">
                            <Label>Название блока</Label>
                            <Input
                                value={localBlock.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Введите название блока"
                                className="w-full"
                            />
                        </div>
                    )}

                    { localBlock.fields && localBlock.fields.length > 0 ? localBlock.fields
                        .filter(field => field.name != 'title')
                        .map((field, index) => {
                            const isError = !!validationErrors[field.id];
                            return (
                            <div key={index} className={'flex flex-col gap-2'}>
                                <Label>
                                    {field.label}
                                    {field.required && (<span className={'text-red-600'}>*</span>)}
                                </Label>
                                {field.type === 'text' ? (
                                    <Input
                                        value={field.value || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder || field.label}
                                        required={field.required}
                                    />
                                ) : field.type === 'textarea' ? (
                                    <Textarea
                                        value={field.value || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder || field.label}
                                        fitContent
                                        className={'max-h-50'}
                                        required={field.required}
                                    />
                                ) : field.type === 'number' ? (
                                    <Input
                                        type={'number'}
                                        value={field.value || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder || field.label}
                                        required={field.required}
                                    />
                                ) : (
                                    <Input
                                        value={field.value || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder || field.label}
                                        required={field.required}
                                    />
                                )}
                                {isError && (
                                    <div className="text-xs text-red-600 mt-1">
                                        {validationErrors[field.id]}
                                    </div>
                                )}
                            </div>
                        )}
                    ) : (
                        <p>
                            Нет блоков
                        </p>
                    )}
                </div>
            </div>
            <span className={'mb-1 text-xs'}>
                template code: {localBlock.templateCode}
            </span>
        </>
    )
}

export {BlockEditor, type IBlockEditorProps}