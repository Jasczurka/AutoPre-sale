import React from "react";
import type {ITemplateDto} from "@entities/block_template/interface/index.dto.ts";

interface IFieldProps {
    id: string;
    name: string;
    label: string;
    value?: string;
    setValue?: (value: string) => void;
    required?: boolean;
    type?: "number" | "list" | "text" | "textarea" | "select" | "checkbox";
    options?: Array<{label: string; value: string}>;
    placeholder?: string;
}

interface IBlockItem {
    id: string;
    title: string;
    setTitle?: (value: string) => void;
    isActive?: boolean;
    order?: number;
    fields?: IFieldProps[];
    templateId?: string;
    templateCode?: string;

    onUpdate?: (updates: Partial<IBlockItem>) => void;
}

interface ISlideItem extends IBlockItem {
    blocks?: IBlockItem[];
    thumbnail?: string;
    //<-- Изображение слайда
}

interface ISlideListProps {
    list: ISlideItem[];
    onSelectSlide?: (slideId: string) => void;
    handleSlideContextMenu?: (e:React.MouseEvent, slideId: string, name: string) => void;
}

interface IBlockListProps extends ISlideListProps {
    onSelectBlock?: (blockId: string, slideId: string) => void;
    onDragStart?: (blockId: string, slideId: string) => void;
    onDrop?: (blockId: string, targetSlideId: string, targetIndex?: number, dropPosition?: "before" | "after") => void;
    handleBlockContextMenu?: (e: React.MouseEvent, blockId: string, slideId: string, blockName?: string) => void;
    onAddTemplateBlock?: (template: ITemplateDto, slideId: string) => void;

    onBlockUpdate?: (slideId: string, blockId: string, updates: Partial<IBlockItem>) => void;
}

export type {IBlockListProps, ISlideItem, IBlockItem, ISlideListProps}