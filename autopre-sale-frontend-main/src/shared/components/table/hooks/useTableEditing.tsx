import {useCallback, useState} from "react";
import type {ITableRowProps} from "@shared/components/table/interface";


const useTableEditing = (
    tableData: ITableRowProps[],
    updateTableData: (updater: (data: ITableRowProps[]) => ITableRowProps[]) => void,
    findRow:  (items: ITableRowProps[], id: string, parent?: ITableRowProps) => ({ row: ITableRowProps, parent?: ITableRowProps } | null)
) => {
    const [editingCell, setEditingCell] = useState<{ rowId: string; cellIndex: number } | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    const handleCellDoubleClick = useCallback((rowId: string, cellIndex: number) => {
        const result = findRow(tableData, rowId);
        if (!result) return;

        const cellValue = result.row.rowValues?.[cellIndex]?.value || '';
        setEditingCell({ rowId, cellIndex });
        setEditingValue(cellValue);
    }, [findRow, tableData]);

    const handleCellEdit = useCallback((value: string) => {
        setEditingValue(value);
    }, []);

    const handleCellEditComplete = useCallback(() => {
        if (editingCell) {
            updateTableData(data => {
                const updateRecursive = (items: ITableRowProps[]): ITableRowProps[] => {
                    return items.map(item => {
                        if (item.workNumber === editingCell.rowId) {
                            return {
                                ...item,
                                rowValues: item.rowValues?.map((cell, idx) =>
                                    idx === editingCell.cellIndex ? { value: editingValue } : cell
                                )
                            };
                        }
                        if (item.children) {
                            return {
                                ...item,
                                children: updateRecursive(item.children)
                            };
                        }
                        return item;
                    });
                };

                return updateRecursive(data);
            });
        }

        setEditingCell(null);
        setEditingValue('');
    }, [editingCell, editingValue, updateTableData]);
    
    const handleRowClick = useCallback((rowId: string) => {
        if (editingCell && editingCell.rowId !== rowId) {
            handleCellEditComplete();
        }
    }, [editingCell, handleCellEditComplete]);

    return {
        editingCell,
        editingValue,
        handleCellDoubleClick,
        handleCellEdit,
        handleCellEditComplete,
        handleRowClick
    };
}
export { useTableEditing };