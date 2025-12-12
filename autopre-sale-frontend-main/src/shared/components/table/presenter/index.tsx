import React, {useCallback, useMemo} from "react";
import type {ITableRowProps} from "@shared/components/table/interface";
import {useContextMenu} from "@widgets/context_menu/use-case";
import {ICON_PATH} from "@shared/components/images/icons";
import {useTableData} from "@shared/components/table/hooks/useTableData.tsx";
import {useTableEditing} from "@shared/components/table/hooks/useTableEditing.tsx";
import {useTableSearch} from "@shared/components/table/hooks/useTableSearch.tsx";
import {useTableDnD} from "@shared/components/table/hooks/useTableDnD.tsx";

const useTablePresenter = (
    values: ITableRowProps[] | undefined,
) => {
    const {
        tableData,
        setTableData,
        updateTableData,
        addRow,
        deleteRow,
        findRow,
        handleToggle,
        renumberTable,
    } = useTableData(values)

    const {
        editingCell, 
        editingValue,
        handleCellDoubleClick,
        handleCellEdit,
        handleCellEditComplete,
        handleRowClick
    } = useTableEditing(tableData, updateTableData, findRow);

    const {
        searchValues,
        filteredData,
        handleSearchChange
    } = useTableSearch(tableData)

    const {
        draggedRow, 
        dragOverRow, 
        dropPosition,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    } = useTableDnD(setTableData, renumberTable, handleToggle)

    const {showContextMenu} = useContextMenu()

    const showContextMenuHandle = useCallback((e: React.MouseEvent, rowId: string) => {
        e.preventDefault();
        const result = findRow(tableData, rowId);
        if (!result) return;
        const {row} = result;
        const currentLevel = row.level || '1';
        const canAddChild = currentLevel !== '3';

        showContextMenu({
            items: [
                {
                    id: "add",
                    icon: ICON_PATH.ADD,
                    label: 'Добавить работу',
                    onClick: () => addRow(rowId, false),
                },{
                    id: "add-child",
                    icon: ICON_PATH.ADD_MULTIPLE,
                    label: 'Добавить подзадачу',
                    onClick: () => addRow(rowId, true),
                    disabled: !canAddChild,
                }, {
                    id: "delete",
                    icon: ICON_PATH.REMOVE,
                    label: "Удалить работу",
                    onClick: () => deleteRow(rowId)
                }
            ],
            position: { x: e.clientX, y: e.clientY }
        });
    }, [addRow, deleteRow, findRow, showContextMenu, tableData]);

    return useMemo(() => ({
        // Data state
        data: {
            filteredData,
            searchValues,
            tableData, // Добавил для отладки если нужно
        },

        // Editing state and handlers
        editing: {
            editingCell,
            editingValue,
            handlers: {
                handleRowClick,
                handleCellDoubleClick,
                handleCellEdit,
                handleCellEditComplete,
            }
        },

        // Search handlers
        search: {
            handleSearchChange,
        },

        // Row operations
        rowOperations: {
            handleToggle,
            showContextMenuHandle,
        },

        // Drag and drop
        dragAndDrop: {
            draggedRow,
            dragOverRow,
            dropPosition,
            handlers: {
                handleDragStart,
                handleDragOver,
                handleDragLeave,
                handleDrop,
            }
        },

        // Utility functions (если нужны внешнему коду)
        actions: {
            addRow,
            deleteRow,
            findRow: (id: string) => findRow(tableData, id),
        }
    }), [
        // Data dependencies
        filteredData, searchValues, tableData,
        // Editing dependencies
        editingCell, editingValue, handleRowClick, handleCellDoubleClick, handleCellEdit, handleCellEditComplete,
        // Search dependencies
        handleSearchChange,
        // Row operations dependencies
        handleToggle, showContextMenuHandle,
        // Drag and drop dependencies
        draggedRow, dragOverRow, dropPosition, handleDragStart, handleDragOver, handleDragLeave, handleDrop,
        // Actions dependencies
        addRow, deleteRow, findRow,
    ]);
}

export default useTablePresenter