import React from "react";

interface IStaticTableProps {
    data?: IStaticTableRow[];
    headers?: string[];
    columnWidths?: string[];
}

interface ITableFieldProps {
    value: string | null;
}

interface ITableProps {
    values?: ITableRowProps[];
    onDataChange?: (data: ITableRowProps[]) => void;
}

interface IStaticTableRow {
    id: string;
    cells: React.ReactNode[] | string[];
}

interface ITableRowProps {
    rowIndex?: number;
    workNumber: string;
    canOpen?: boolean;
    isOpen?: boolean;
    level?: '1'| '2'| '3' | undefined;
    rowValues?: ITableFieldProps[];
    children?: ITableRowProps[] | undefined;
    onRowClick?: () => void;
    onCellDoubleClick?: (index: number) => void;
    onContextMenu?: (event: React.MouseEvent) => void;
    onToggle?: () => void;
    editingCell?: { rowId: string; cellIndex: number } | null;
    editingValue?: string;
    onCellEdit?: (value: string) => void;
    onCellEditComplete?: () => void;
    // Drag and drop пропсы
    onDragStart?: (e: React.DragEvent, row: ITableRowProps) => void;
    onDragOver?: (e: React.DragEvent, rowId: string) => void;
    onDragLeave?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent, rowId: string) => void;
    isDragOver?: boolean;
    dropPosition?: 'before' | 'after' | 'inside' | null;
}

export type { ITableProps, ITableRowProps, IStaticTableProps, ITableFieldProps}