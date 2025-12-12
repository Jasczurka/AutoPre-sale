import type {IContextMenuItem, IContextMenuShowParams} from "@widgets/context_menu/interface";
import {type FC, Fragment, useEffect, useRef} from "react";
import style from '../style/context_menu.module.css'
import Icon from "@mdi/react";

const ContextMenu: FC<IContextMenuShowParams> = ({
    items,
    position,
    onClose
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)){
                onClose?.()
            }
        }
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    useEffect(() => {
        if (menuRef.current) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();

            // Проверяем, чтобы меню не выходило за границы экрана
            let x = position.x;
            let y = position.y;

            if (x + rect.width > window.innerWidth) {
                x = window.innerWidth - rect.width - 10;
            }

            if (y + rect.height > window.innerHeight) {
                y = window.innerHeight - rect.height - 10;
            }

            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
        }
    }, [position]);

    const handleItemClick = (item: IContextMenuItem) => {
        if (!item.disabled) {
            item.onClick?.();
            onClose?.();
        }
    };
    return (
        <div
            ref={menuRef}
            className={style.contextMenu}
            role="menu"
            aria-labelledby="context-menu"
        >
            {items.map((item) => (
                <Fragment key={item.id}>
                    {item.divider ? (
                        <div className={style.divider}/>
                    ) : (
                        <button
                            className={style.item}
                            onClick={() => handleItemClick(item)}
                            disabled={item.disabled}
                            role="menuitem"
                        >
                            {item.icon && <Icon path={item.icon} size={1}/>}
                            <span className={style.label}>{item.label}</span>
                        </button>
                    )}
                </Fragment>
            ))}
        </div>
    )
}

export {ContextMenu};