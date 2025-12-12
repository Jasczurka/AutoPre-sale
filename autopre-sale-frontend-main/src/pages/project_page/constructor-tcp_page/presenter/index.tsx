import {
    type IBlockItem,
    type IBlockListProps,
    type ISlideItem,
    type ISlideListProps
} from "@shared/components/constructor_tcp/block_list";
import {useBlockList} from "@pages/project_page/constructor-tcp_page/presenter/useBlockList.tsx";
import React, {useCallback, useMemo, useState} from "react";
import {ICON_PATH} from "@shared/components/images/icons";
import {useContextMenu} from "@widgets/context_menu/use-case";
import {useGetAllTemplates} from "@entities/block_template/query";
import type {ITemplateDto} from "@entities/block_template/interface/index.dto.ts";
import type {IBlockEditorProps} from "@pages/project_page/constructor-tcp_page/component/blockEditor.tsx";
import type {IAccordionTKP} from "@shared/components/modal_tkp/component/AccordionTKP.tsx";

const useConstructorPagePresenter = () => {

    const { showContextMenu } = useContextMenu();
    const {data: templatesList, isLoading: isLoadingTemplates } = useGetAllTemplates()

    const initialSlideList: ISlideItem[] =  useMemo(() =>[
        {
            id: '1',
            title: 'Слайд 1',
            order: 1,
            blocks: [
                {
                    id: '1',
                    title: 'Описание проекта',
                    templateId: '1',
                    templateCode: 'project_overview_v1',
                    fields: [
                        {
                            id: 'field-1',
                            name: 'title',
                            label: 'Заголовок',
                            value: '',
                            type: 'text',
                            required: true,
                            placeholderName: 'TitlePlaceholder'
                        },
                        {
                            id: 'field-2',
                            name: 'description',
                            label: 'Описание',
                            value: '',
                            type: 'textarea',
                            placeholderName: 'Body'
                        }
                    ]
                },{
                    id: '2',
                    title: 'Цель проекта',
                    templateId: '2',
                    templateCode: 'project_goals_v1',
                    fields: [
                        {
                            id: 'field-3',
                            name: 'title',
                            label: 'Заголовок',
                            value: '',
                            type: 'text',
                            placeholderName: 'Title'
                        },
                        {
                            id: 'field-4',
                            name: 'goal1',
                            label: 'Цель 1',
                            value: '',
                            type: 'text',
                            placeholderName: 'Goal1'
                        }
                    ]
                }
            ]
        },{
            id: '2',
            title: 'Слайд 2',
            order: 2,
            blocks: [
                {
                    id: '3',
                    title: 'Техническое решение',
                    templateId: '2',
                    templateCode: 'project_goals_v1',
                    fields: [
                        {
                            id: 'field-5',
                            name: 'title',
                            label: 'Заголовок',
                            value: '',
                            type: 'text',
                        },
                        {
                            id: 'field-6',
                            name: 'architecture',
                            label: 'Цель 1',
                            value: '',
                            type: 'textarea',
                        },
                        {
                            id: 'field-7',
                            name: 'technologies',
                            label: 'Цель 1',
                            value: '',
                            type: 'text',
                        },
                        {
                            id: 'field-8',
                            name: 'requirements',
                            label: 'Цель 1',
                            value: '',
                            type: 'textarea',
                        }
                    ]
                }
            ]
        }
    ], []);

    const {
        list,
        moveBlock,
        selectBlock,
        selectSlide,
        handleDeleteBlock,
        handleDeleteSlide,
        handleAddSlide,
        activeSlide,
        activeBlock,
        addBlockFromTemplate,
        activeSlideId,
        groupedTemplates,
        updateBlock
    } = useBlockList({
        initialList: initialSlideList,
        availableTemplates: templatesList?.templates
    })


    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const handleSlideContextMenu = useCallback((e: React.MouseEvent, slideId: string, name: string)=>{
        e.preventDefault()
        e.stopPropagation()
        showContextMenu({
            position:{ x: e.clientX, y: e.clientY },
            items: [
                {
                    id: 'addSlide',
                    label: `Создать слайд ниже`,
                    icon: ICON_PATH.ADD,
                    onClick: () => handleAddSlide(slideId)
                }, {
                    id: 'deleteSlide',
                    label: `Удалить слайд ${name}`,
                    icon: ICON_PATH.DELETE,
                    onClick: () => handleDeleteSlide(slideId),
                    disabled: list.length <= 1 // Нельзя удалить последний слайд
                }
            ]
        })
    }, [handleAddSlide, handleDeleteSlide, list.length, showContextMenu])

    const handleBlockContextMenu = useCallback((e: React.MouseEvent, blockId: string, slideId: string, blockName?: string) => {
        e.preventDefault();
        e.stopPropagation();

        showContextMenu({
            position: {
                x: e.clientX,
                y: e.clientY
            },
            items: [
                {
                    id: 'delete-block',
                    label: `Удалить блок "${blockName ?? blockId}"`,
                    icon: ICON_PATH.DELETE,
                    onClick: () => handleDeleteBlock(blockId, slideId)
                }
            ]
        });
    }, [handleDeleteBlock, showContextMenu]);

    const handleAddTemplateBlock = useCallback((template: ITemplateDto) => {
        const targetSlideId = sessionStorage.getItem('targetSlideForTemplate') || activeSlideId;

        if (targetSlideId) {
            addBlockFromTemplate(template);
            setShowTemplateModal(false);
            sessionStorage.removeItem('targetSlideForTemplate');
        }
    }, [addBlockFromTemplate, activeSlideId]);


    const handleBlockSave = useCallback((blockId: string, slideId: string, updates: Partial<IBlockItem>) => {
        updateBlock(slideId, blockId, updates);
    }, [updateBlock]);

    const blockListProps = useMemo<IBlockListProps>(() => ({
        list,
        onSelectSlide: selectSlide,
        onSelectBlock: selectBlock,
        onDrop: moveBlock,
        handleBlockContextMenu,
        handleSlideContextMenu
    }), [list, selectSlide, selectBlock, moveBlock, handleBlockContextMenu, handleSlideContextMenu]);

    const slideListProps = useMemo<ISlideListProps>(()=>({
        list,
        onSelectSlide: selectSlide,
        handleSlideContextMenu: handleSlideContextMenu
    }), [handleSlideContextMenu, list, selectSlide]);

    const blockEditorProps = useMemo<IBlockEditorProps>(() => ({
        activeBlock,
        activeSlideId,
        onSave: handleBlockSave
    }), [activeBlock, activeSlideId, handleBlockSave])
    
    const modalTemplatesProps = useMemo<IAccordionTKP>(()=> ({
        groupedTemplates,
        addBlock: handleAddTemplateBlock,
        isLoading: isLoadingTemplates
    }), [groupedTemplates, handleAddTemplateBlock, isLoadingTemplates])
    
    return {
        blockListProps,
        slideListProps,
        blockEditorProps,
        modalTemplatesProps,
        activeSlide,
        showTemplateModal, setShowTemplateModal,
    };
}

export {useConstructorPagePresenter};