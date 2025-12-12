interface IContextMenuPosition {
    x: number
    y: number
}

interface IContextMenuItem {
    id: string;
    label?: string;
    icon?: string;
    onClick?: () => void;
    disabled?: boolean;
    divider?: boolean;
}

interface IContextMenuShowParams {
    items: IContextMenuItem[];
    position: IContextMenuPosition;
    onClose?: () => void;
}

interface IContextMenuContextProps {
    showContextMenu: (params: IContextMenuShowParams) => void;
}

interface IContextMenuInstance extends IContextMenuShowParams{
    id: string;
}

export type { IContextMenuItem, IContextMenuContextProps, IContextMenuInstance, IContextMenuShowParams };