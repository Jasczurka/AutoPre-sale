import type {IBlockListProps, ISlideItem} from "@shared/components/constructor_tcp/block_list";
import style from '../style/block.module.css'
import React, {useCallback, useState} from "react";
import {cn} from "@shared/lib/cn";

interface DnDState {
    draggedBlock: {id: string; slideId: string} | null;
    dragOverTarget: string | null;
    dropPosition: "before" | "after" | null;
    dragOverSlideId: string | null;
}

const BlockList = ({
                       list,
                       onSelectSlide,
                       onSelectBlock,
                       onDragStart,
                       onDrop,
                       handleBlockContextMenu,
                       handleSlideContextMenu
}: IBlockListProps) => {
    const [dndState, setDndState] = useState<DnDState>({
        draggedBlock: null,
        dragOverTarget: null,
        dropPosition: null,
        dragOverSlideId: null
    });

    const handleDragStart = useCallback((e: React.DragEvent, blockId: string, slideId: string) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({blockId, slideId}));
        e.dataTransfer.effectAllowed = "move";
        setDndState(prev => ({...prev, draggedBlock: {id: blockId, slideId}}));
        onDragStart?.(blockId, slideId);
    }, [onDragStart]);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        setDndState({
            draggedBlock: null, dragOverSlideId: null, dragOverTarget: null, dropPosition: null
        })
    }, [])

    const handleDragOverBlock = useCallback((e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (dndState.draggedBlock?.id === targetId) {
            setDndState(prev => ({...prev,
                dragOverTarget: null,
                dropPosition: null,
                dragOverSlideId: null
            }));
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const height = rect.height;

        // Определяем позицию: before или after
        const position: "before" | "after" = mouseY < height * 0.5 ? "before" : "after";

        setDndState(prev => ({
            ...prev,
            dragOverTarget: targetId,
            dropPosition: position,
            dragOverSlideId: null
        }));
    }, [dndState.draggedBlock]);

    const handleDragOverSlide = useCallback((e: React.DragEvent, slideId: string) => {
        e.preventDefault();
        e.stopPropagation();
        // Для слайда просто разрешаем drop
        setDndState(prev => ({...prev,
            dragOverTarget: null,
            dropPosition: null,
            dragOverSlideId: slideId
        }));
    }, []);

    const handleDragLeave = useCallback(() => {
        setDndState(prev => ({...prev, dragOverTarget: null, dropPosition: null}));
    }, []);

    const handleDropOnBlock = useCallback((e: React.DragEvent, targetBlockId: string, slideId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const data = e.dataTransfer.getData("text/plain");

        if (!data || !dndState.dropPosition) return;

        const {blockId: draggedBlockId} = JSON.parse(data);

        if (draggedBlockId === targetBlockId) {
            setDndState({draggedBlock: null, dragOverTarget: null, dropPosition: null, dragOverSlideId: null});
            return;
        }

        // Находим целевой слайд и индекс блока
        const targetSlide = list.find(s => s.blocks?.some(b => b.id === targetBlockId));
        if (!targetSlide) return;

        const targetBlockIndex = targetSlide.blocks!.findIndex(b => b.id === targetBlockId);
        const targetIndex = dndState.dropPosition === "before"
            ? targetBlockIndex
            : targetBlockIndex + 1;

        onDrop?.(draggedBlockId, slideId, targetIndex, dndState.dropPosition);
        setDndState({draggedBlock: null, dragOverTarget: null, dropPosition: null, dragOverSlideId: null});
    }, [dndState.dropPosition, list, onDrop]);

    const handleDropOnSlide = useCallback((e: React.DragEvent, slideId: string) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");

        if (!data) return;

        const {blockId: draggedBlockId} = JSON.parse(data);

        // При дропе на слайд добавляем блок в конец
        const targetSlide = list.find(s => s.id === slideId);
        if (!targetSlide) return;

        const targetIndex = targetSlide.blocks?.length || 0;
        onDrop?.(draggedBlockId, slideId, targetIndex, "after");
        setDndState({draggedBlock: null, dragOverTarget: null, dropPosition: null, dragOverSlideId: null});
    }, [list, onDrop]);

    const handleSlideClick = (e: React.MouseEvent, slideId: string) => {
        e.preventDefault();
        onSelectSlide?.(slideId)
    }

    const handleBlockClick = (e: React.MouseEvent, blockId: string, slideId: string) => {
        e.preventDefault();
        e.stopPropagation();
        onSelectBlock?.(blockId, slideId)
    }

    return (
        <div className={style.list}>
            {list.map((slide) => {
                const isSlideEmpty = !slide.blocks || slide.blocks.length === 0;
                const isSlideDragOver = dndState.dragOverSlideId === slide.id;
                return (
                    <div
                        key={slide.id}
                        className={cn(
                            style.slide,
                            slide.isActive ? style.isActive : '',
                            isSlideEmpty ? style.emptySlide : '',
                            isSlideDragOver ? style.dragOverSlide : ''
                        )}
                        draggable={false}
                        onClick={(e) => handleSlideClick(e, slide.id)}
                        onDragOver={(e) => handleDragOverSlide(e, slide.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDropOnSlide(e, slide.id)}
                        onContextMenu={(e) => handleSlideContextMenu?.(e, slide.id, slide.order?.toString() ?? slide.id)}
                    >
                        <p>{slide.title}</p>

                        {slide.blocks && slide.blocks.length > 0 ? (
                            <div className={style.blocks}>
                                {slide.blocks.map((block: ISlideItem) => {
                                    const isSelected = block.isActive;
                                    const isDragged = dndState.draggedBlock?.id === block.id;
                                    const isDragOver = dndState.dragOverTarget === block.id;

                                    return (
                                        <div
                                            key={block.id}
                                            onDragOver={(e) => handleDragOverBlock(e, block.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDropOnBlock(e, block.id, slide.id)}
                                        >
                                            {/* Drop zone перед блоком */}
                                            {/*isDragOver && dndState.dropPosition === "before" && (
                                                <div className={style.dropZone}></div>
                                            )*/}

                                            {/* Сам блок */}
                                            <div
                                                className={[
                                                    style.blockItem,
                                                    isSelected ? style.selected : '',
                                                    isDragged ? style.dragged : '',
                                                    isDragOver && dndState.dropPosition === "before" ? style.dropBefore : '',
                                                    isDragOver && dndState.dropPosition === "after" ? style.dropAfter : ''
                                                ].join(' ')}
                                                onClick={(e) => handleBlockClick(e, block.id, slide.id)}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, block.id, slide.id)}
                                                onDragEnd={handleDragEnd}
                                                onContextMenu={(e)=>handleBlockContextMenu?.(e, block.id, slide.id, block.title)}
                                            >
                                                <div className={style.blockContent}>
                                                    <span className={style.blockIndicator}></span>
                                                    <span className={style.blockTitle}>{block.title}</span>
                                                </div>
                                            </div>

                                            {/* Drop zone после блока */}

                                            {/*isDragOver && dndState.dropPosition === "after" && (
                                                <div className={style.dropZone}></div>
                                            )*/}
                                        </div>
                                    );
                                })}
                            </div>
                        ): (
                            <span>
                                Нет блоков
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
export {BlockList};