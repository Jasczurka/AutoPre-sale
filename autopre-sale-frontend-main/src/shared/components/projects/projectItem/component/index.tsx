import type {IProjectItemProps} from "@shared/components/projects/projectItem/interface";
import style from '../style/projectItem.module.css'
import Icon from "@mdi/react";
import {ICON_PATH} from "@shared/components/images/icons";
import React, {useCallback, useRef, useState} from "react";

const ProjectItem = ({
                         project,
                         onOpen,
                         onContextMenu,
    ...props
}: IProjectItemProps) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleOpenClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const isButtonClick = target.closest("button") !== null;

        if (!isButtonClick) {
            onOpen();
        }
    }

    const handleContextMenu = (e: React.MouseEvent)=> {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e);
    }
    
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ")  {
            e.preventDefault();
            onOpen()
        }
        if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') {
            e.preventDefault();
            // Создаем синтетическое событие мыши
            const rect = itemRef.current?.getBoundingClientRect();
            if (rect) {
                const syntheticEvent = {
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                } as React.MouseEvent;
                onContextMenu(syntheticEvent);
            }
        }
    }, [onContextMenu, onOpen])

    return (
        <div
            {...props}
            //className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm relative"
            ref={itemRef}
            className={style.item}
            onClick={handleOpenClick}
            onContextMenu={handleContextMenu}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onFocus={()=>setIsFocused(true)}
            onBlur={()=> setIsFocused(false)}
            role='button'
            aria-label={`${project.name}. Нажмите Enter для открытия, Shift+F10 для меню`}
            title={isFocused ? `${project.name}. Нажмите Enter для открытия, Shift+F10 для меню` : project.name}
        >
            <h6># {project.id}</h6>
            <p>
                {project.name}
            </p>
            <button onClick={onContextMenu}>
                <Icon path={ICON_PATH.MORE_VERT} size={1}/>
            </button>
        </div>
    );
};

export {ProjectItem}