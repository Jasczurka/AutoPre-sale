import { useContext} from 'react';
import {ContextMenuContext} from "@widgets/context_menu/context";

const useContextMenu = () => {
    const ctx = useContext(ContextMenuContext)
    if (!ctx) throw new Error('useContextMenu must be used within ContextMenuProvider')
    return ctx
}

export {useContextMenu}