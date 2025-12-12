// useBlockList.ts
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {IBlockItem, ISlideItem} from "@shared/components/constructor_tcp/block_list";
import type {ITemplateDto, ITemplateFields} from "@entities/block_template/interface/index.dto.ts";

interface IUseBlockListProps {
    initialList: ISlideItem[],
    availableTemplates?: ITemplateDto[]
}

const useBlockList = ({
                          initialList,
                          availableTemplates = []
}:IUseBlockListProps) => {
    const [list, setList] = useState<ISlideItem[]>(initialList);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null);

    const [templates, setTemplates] = useState<ITemplateDto[]>(availableTemplates);

    useEffect(() => {
        if (availableTemplates && availableTemplates.length > 0) {
            setTemplates(availableTemplates);
        }
    }, [availableTemplates]);

    const activeSlide = useMemo(() =>
            list.find(slide => slide.id === activeSlideId) || null,
        [list, activeSlideId]);

    const activeBlock = useMemo(() => {
        if (!activeSlide || !activeBlockId) return null;
        return activeSlide.blocks?.find(block => block.id === activeBlockId) || null;
    }, [activeSlide, activeBlockId]);

    const generateId = useCallback((prefix: string) => {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const updateBlockTitle = useCallback((blockId: string, slideId: string, newTitle: string) => {
        setList(prev => prev.map(slide => {
            if (slide.id === slideId) {
                return {
                    ...slide,
                    blocks: slide.blocks?.map(block =>
                        block.id === blockId
                            ? { ...block, title: newTitle }
                            : block
                    )
                };
            }
            return slide;
        }));
    }, []);

    const updateBlockFieldValue = useCallback((blockId: string, slideId: string, fieldId: string, value: string) => {
        setList(prev => prev.map(slide => {
            if (slide.id === slideId) {
                return {
                    ...slide,
                    blocks: slide.blocks?.map(block => {
                        if (block.id === blockId && block.fields) {
                            return {
                                ...block,
                                fields: block.fields.map(field =>
                                    field.id === fieldId
                                        ? { ...field, value }
                                        : field
                                )
                            };
                        }
                        return block;
                    })
                };
            }
            return slide;
        }));
    }, []);

    const convertTemplateFieldsToBlockFields = useCallback((
        templateFields: ITemplateFields,
        templateId: string
    ): IBlockItem['fields'] => {
        return Object.entries(templateFields).map(([fieldName, templateField], index) => ({
            id: `${templateId}-${fieldName}-${index}`,
            name: fieldName,
            label: templateField.label || fieldName,
            type: templateField.type,
            required: templateField.required || false,
            value: templateField.defaultValue?.toString() || '',
            placeholder: templateField.placeholderName,
            options: templateField.options
        }));
    }, []);

    const createBlockFromTemplate = useCallback((template: ITemplateDto): IBlockItem => {
        const blockId = generateId('block');

        return {
            id: blockId,
            title: template.name,
            isActive: false,
            order: 0, // Будет установлен при добавлении в слайд
            fields: convertTemplateFieldsToBlockFields(template.fields, template.id),
            templateId: template.id,
            templateCode: template.code
        };
    }, [generateId, convertTemplateFieldsToBlockFields]);


    const moveBlock = (blockId: string, targetSlideId: string, targetIndex?: number) => {
        setList(prev => {
            // Глубокая копия для иммутабельности
            const newList = prev.map(slide => ({
                ...slide,
                blocks: slide.blocks ? [...slide.blocks] : undefined
            }));

            // Находим блок и его текущий слайд
            let sourceSlideIndex = -1;
            let blockIndex = -1;
            let blockData: IBlockItem | null = null;

            newList.forEach((slide, sIndex) => {
                slide.blocks?.forEach((block, bIndex) => {
                    if (block.id === blockId) {
                        sourceSlideIndex = sIndex;
                        blockIndex = bIndex;
                        blockData = block;
                    }
                });
            });

            if (!blockData || sourceSlideIndex === -1) return prev;

            // Удаляем из исходного слайда
            newList[sourceSlideIndex] = {
                ...newList[sourceSlideIndex],
                blocks: newList[sourceSlideIndex].blocks?.filter((_, i) => i !== blockIndex) || []
            };

            // Добавляем в целевой слайд
            const targetSlideIndex = newList.findIndex(s => s.id === targetSlideId);
            if (targetSlideIndex !== -1) {
                const targetBlocks = newList[targetSlideIndex].blocks ? [...newList[targetSlideIndex].blocks!] : [];
                const insertIndex = targetIndex !== undefined
                    ? Math.max(0, Math.min(targetIndex, targetBlocks.length))
                    : targetBlocks.length;

                targetBlocks.splice(insertIndex, 0, blockData);

                newList[targetSlideIndex] = {
                    ...newList[targetSlideIndex],
                    blocks: targetBlocks
                };
            }

            return newList;
        });

        // Обновляем активный блок, если он был перемещен
        if (blockId === activeBlockId) {
            setActiveSlideId(targetSlideId);
        }
    };

    const selectSlide = useCallback((slideId: string) => {
        setActiveSlideId(slideId);
        setActiveBlockId(null);
        
        setList(prev => prev.map(slide => ({
            ...slide,
            isActive: slide.id === slideId,
            blocks: slide.blocks?.map(block => ({
                ...block,
                isActive: false // Сбрасываем активность блоков
            }))
        })));
    }, []);
    
    const selectBlock = useCallback((blockId: string, slideId: string) => {
        setActiveBlockId(blockId);
        setActiveSlideId(slideId);

        setList(prev => prev.map(slide => {
            if (slide.id === slideId) {
                return {
                    ...slide,
                    isActive: true, // Помечаем слайд как активный
                    blocks: slide.blocks?.map(block => ({
                        ...block,
                        isActive: block.id === blockId
                    }))
                };
            }
            // Для остальных слайдов сбрасываем активность
            return {
                ...slide,
                isActive: false,
                blocks: slide.blocks?.map(block => ({
                    ...block,
                    isActive: false
                }))
            };
        }))
    }, []);


    const addBlockFromTemplate = useCallback((template: ITemplateDto) => {
        if (!activeSlideId) return;

        const newBlock = createBlockFromTemplate(template);

        setList(prev => prev.map(slide => {
            if (slide.id === activeSlideId) {
                const currentBlocks = slide.blocks || [];
                const insertIndex = /*index !== undefined ? index : */currentBlocks.length;

                // Обновляем порядок всех блоков
                const updatedBlocks = [...currentBlocks];
                updatedBlocks.splice(insertIndex, 0, newBlock);

                // Обновляем порядок
                const blocksWithOrder = updatedBlocks.map((block, idx) => ({
                    ...block,
                    order: idx
                }));

                return {
                    ...slide,
                    blocks: blocksWithOrder
                };
            }
            return slide;
        }));

        // Автоматически выбираем созданный блок
        setTimeout(() => {
            selectBlock(newBlock.id, activeSlideId);
        }, 100);
    }, [activeSlideId, createBlockFromTemplate, selectBlock]);

    const handleAddSlide = useCallback((relativeSlideId?: string) => {
        setList(prev =>{
            const newSlideId = generateId('slide');
            const newSlide: ISlideItem = {
                id: newSlideId,
                title: `Слайд ${prev.length + 1}`,
                isActive: false,
                blocks: [],
                order: prev.length + 1
            }

            if (!relativeSlideId) {
                return [...prev, newSlide];
            }
            const relativeIndex = prev.findIndex(slide => slide.id === relativeSlideId);
            if (relativeIndex === -1) {
                return [...prev, newSlide]; // Если слайд не найден, добавляем в конец
            }

            const insertIndex = relativeIndex + 1;

            const newList = [...prev];
            newList.splice(insertIndex, 0, newSlide);

            return newList.map((slide, index) => ({
                ...slide,
                order: index + 1
            }));
        })
    }, [generateId])

    const handleDeleteSlide = useCallback((slideId: string) => {
        setList(prev => prev.filter(slide => slide.id !== slideId));
        if (slideId === activeSlideId) {
            setActiveSlideId(null);
            setActiveBlockId(null);
        }
    }, [activeSlideId]);

    const handleDeleteBlock = useCallback((blockId: string, slideId: string) => {
        setList(prev => prev.map(slide => {
            if (slide.id === slideId) {
                const newBlocks = slide.blocks?.filter(block => block.id !== blockId) || [];
                return {
                    ...slide,
                    blocks: newBlocks
                };
            }
            return slide;
        }));
        if (blockId === activeBlockId) {
            setActiveBlockId(null);
        }
    }, [activeBlockId]);


    const groupedTemplates  = useMemo(() => {
        const grouped: Record<string, ITemplateDto[]> = {
            'Общее': [],
            'Описание': [],
            'Цели': [],
            'Техническое': [],
            'Планирование': [],
            'Бюджет': []
        };

        templates.forEach(template => {
            const code = template.code.toLowerCase();
            const name = template.name.toLowerCase();

            if (code.includes('overview') || name.includes('описание')) {
                grouped['Описание'].push(template);
            } else if (code.includes('goal') || name.includes('цель')) {
                grouped['Цели'].push(template);
            } else if (code.includes('technical') || code.includes('solution') || name.includes('техническое')) {
                grouped['Техническое'].push(template);
            } else if (code.includes('timeline') || code.includes('plan') || name.includes('план')) {
                grouped['Планирование'].push(template);
            } else if (code.includes('budget') || code.includes('cost') || name.includes('бюджет')) {
                grouped['Бюджет'].push(template);
            } else {
                grouped['Общее'].push(template);
            }
        });

        // Убираем пустые категории
        Object.keys(grouped).forEach(key => {
            if (grouped[key].length === 0) {
                delete grouped[key];
            }
        });

        return grouped;
    }, [templates]);

    const updateBlock = useCallback((slideId: string, blockId: string, updates: Partial<IBlockItem>) => {
        setList(prev => prev.map(slide => {
            if (slide.id === slideId) {
                return {
                    ...slide,
                    blocks: slide.blocks?.map(block => {
                        if (block.id === blockId) {
                            // Обновляем title если он есть в updates
                            const updatedBlock = { ...block, ...updates };

                            // Если есть fields в updates, мержим их с существующими
                            if (updates.fields && block.fields) {
                                updatedBlock.fields = block.fields.map(existingField => {
                                    const updatedField = updates.fields?.find(f => f.id === existingField.id);
                                    return updatedField ? { ...existingField, ...updatedField } : existingField;
                                });
                            }

                            return updatedBlock;
                        }
                        return block;
                    })
                };
            }
            return slide;
        }));
    }, []);

    return {
        list,
        moveBlock,
        selectBlock,
        selectSlide,
        handleAddSlide,
        setList,
        handleDeleteSlide,
        handleDeleteBlock,
        activeBlockId,
        activeSlideId,
        activeSlide,
        activeBlock,
        groupedTemplates,
        updateBlockTitle,
        updateBlockFieldValue,
        addBlockFromTemplate,
        updateBlock
    };
};

export {useBlockList};