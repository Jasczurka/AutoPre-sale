import React, {type Dispatch, type SetStateAction, useCallback, useState} from "react";
import type {ITableRowProps} from "@shared/components/table/interface";

const MAX_LEVEL = 3;

const useTableDnD = (
    setTableData: Dispatch<SetStateAction<ITableRowProps[]>>,
    renumberTable: (items: ITableRowProps[]) => ITableRowProps[],
    handleToggle: (rowId: string) => void,
) => {
    const [draggedRow, setDraggedRow] = useState<ITableRowProps | null>(null);
    const [dragOverRow, setDragOverRow] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<"before" | "after" | "inside" | null>(null);

    const resetDnDState = useCallback(() => {
        setDraggedRow(null);
        setDragOverRow(null);
        setDropPosition(null);
    }, []);

    const handleDragStart = useCallback((e: React.DragEvent, row: ITableRowProps) => {
        e.dataTransfer.setData("text/plain", row.workNumber);
        e.dataTransfer.effectAllowed = "move";
        setDraggedRow(row);

        if (row.isOpen) handleToggle(row.workNumber)
    }, [handleToggle]);

    const handleDragOver = useCallback((e: React.DragEvent, targetRowId: string) => {
        e.preventDefault();

        if (draggedRow?.workNumber === targetRowId) {
            setDragOverRow(null);
            setDropPosition(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const height = rect.height;

        const position: "before" | "after" | "inside" =
            mouseY < height * 0.33
                ? "before"
                : mouseY > height * 0.66
                    ? "after"
                    : "inside";

        setDragOverRow(targetRowId);
        setDropPosition(position);
    }, [draggedRow]);

    const handleDragLeave = useCallback(() => {
        setDragOverRow(null);
        setDropPosition(null);
    }, []);

    const removeRow = useCallback((items: ITableRowProps[], id: string): ITableRowProps[] =>
            items
                .map((item) => ({
                    ...item,
                    children: item.children ? removeRow(item.children, id) : undefined,
                }))
                .filter((x) => x.workNumber !== id),
        []);


    const liftChildrenToThirdLevel = useCallback((children: ITableRowProps[]): ITableRowProps[] => {
        return children.map(child => ({
            ...child,
            level: "3" as "1" | "2" | "3", // 🔥 Всех детей поднимаем до 3 уровня
            isOpen: false,
            children: child.children ? liftChildrenToThirdLevel(child.children) : undefined
        }));
    }, []);

    const insertRow = useCallback((
        items: ITableRowProps[],
        row: ITableRowProps,
        targetId: string,
        pos: "before" | "after" | "inside"
    ): ITableRowProps[] => {
        const result: ITableRowProps[] = [];
        let inserted = false;

        for (const item of items) {
            if (!inserted && item.workNumber === targetId) {
                if (pos === "before") {
                    result.push({ ...row, isOpen: false });
                    result.push(item);
                    inserted = true;
                } else if (pos === "after") {
                    result.push(item);
                    result.push({ ...row, isOpen: false });
                    inserted = true;
                } else if (pos === "inside") {
                    const currentLevel = Number(item.level ?? 1);

                    if (currentLevel >= MAX_LEVEL) {
                        // 🔥 Если родитель уже на 3 уровне - вставляем после
                        result.push(item);
                        result.push({ ...row, isOpen: false });
                    } else {
                        const childLevel = Math.min(currentLevel + 1, MAX_LEVEL);

                        // 🔥 Проверяем, не окажутся ли дети глубже 3 уровня
                        const shouldLiftChildren = childLevel >= MAX_LEVEL && row.children;

                        const newChild = {
                            ...row,
                            level: String(childLevel) as "1" | "2" | "3",
                            isOpen: false,
                            // 🔥 Поднимаем детей только если они окажутся глубже 3 уровня
                            children: shouldLiftChildren ? liftChildrenToThirdLevel(row.children as ITableRowProps[]) : row.children
                        };

                        result.push({
                            ...item,
                            canOpen: true,
                            isOpen: true,
                            children: [...(item.children || []), newChild],
                        });
                    }
                    inserted = true;
                }
            } else {
                const newItem = { ...item };
                if (item.children && !inserted) {
                    newItem.children = insertRow(item.children, row, targetId, pos);
                }
                result.push(newItem);
            }
        }

        return result;
    }, [liftChildrenToThirdLevel]);

    const normalizeLevels = useCallback((items: ITableRowProps[], currentLevel: number = 1): ITableRowProps[] => {
        const result: ITableRowProps[] = [];

        for (const item of items) {
            const newLevel = Math.min(currentLevel, MAX_LEVEL);

            let newChildren: ITableRowProps[] | undefined;
            if (item.children && item.children.length > 0) {
                newChildren = normalizeLevels(item.children, newLevel + 1);

                // 🔥 Если текущий элемент на 3 уровне и у него есть дети - поднимаем детей
                if (newLevel >= MAX_LEVEL && newChildren && newChildren.length > 0) {
                    // Добавляем текущий элемент БЕЗ детей
                    result.push({
                        ...item,
                        level: String(newLevel) as "1" | "2" | "3",
                        children: undefined,
                        canOpen: false,
                        isOpen: false
                    });
                    // 🔥 Добавляем детей как отдельные элементы на том же уровне
                    result.push(...newChildren.map(child => ({
                        ...child,
                        level: "3" as "1" | "2" | "3"
                    })));
                } else {
                    // Обычный случай - сохраняем элемент с детьми
                    result.push({
                        ...item,
                        level: String(newLevel) as "1" | "2" | "3",
                        children: newChildren,
                        canOpen: newChildren && newChildren.length > 0,
                        isOpen: newChildren && newChildren.length > 0 ? item.isOpen : false
                    });
                }
            } else {
                // Элемент без детей
                result.push({
                    ...item,
                    level: String(newLevel) as "1" | "2" | "3",
                    children: undefined,
                    canOpen: false,
                    isOpen: false
                });
            }
        }

        return result;
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("text/plain");

        if (!draggedRow || draggedId === targetId || dropPosition == null) {
            resetDnDState();
            return;
        }

        setTableData((prev) => {
            let data = removeRow(prev, draggedId);
            data = insertRow(data, draggedRow, targetId, dropPosition);
            return renumberTable(normalizeLevels(data));
        });

        resetDnDState();
    }, [draggedRow, dropPosition, insertRow, normalizeLevels, removeRow, renumberTable, resetDnDState, setTableData]);

    return {
        draggedRow,
        dragOverRow,
        dropPosition,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
};

export { useTableDnD };