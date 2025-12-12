import {type PropsWithChildren, useCallback, useState} from "react";
import type {IContextMenuInstance, IContextMenuShowParams} from "@widgets/context_menu/interface";
import {ContextMenuContext} from "@widgets/context_menu/context";
import {ContextMenu} from "@widgets/context_menu/component";

const ContextMenuProvider = ({children} : PropsWithChildren) => {
    const [menu, setMenu] = useState<IContextMenuInstance|null>(null);

    const showContextMenu = useCallback(({ items, position }: IContextMenuShowParams) => {
        const id = crypto.randomUUID()
        setMenu({ id, items, position })
    }, [])

    const closeContextMenu = useCallback(() => {
        setMenu(null)
    }, [])

    return (
        <ContextMenuContext.Provider value={{showContextMenu}}>
            {children}
            {menu != null &&
                <ContextMenu {...menu} onClose={closeContextMenu}/>
            }
        </ContextMenuContext.Provider>
    )
}

export {ContextMenuProvider}