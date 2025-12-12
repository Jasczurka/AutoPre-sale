import {useCallback, useState} from "react";
import type {ITableRowProps} from "@shared/components/table/interface";

const useTableData = (initialValues?: ITableRowProps[]) => {
    const defaultData: ITableRowProps[] = [
        {
            workNumber: '1',
            canOpen: true,
            isOpen: true,
            rowValues: [{value: 'Значение 1'}, {value: 'Значение 1'}],
            children: [
                {
                    workNumber: '1.1',
                    level: '2',
                    rowValues: [{value: 'Значение 1.1'}, {value: 'Значение 1.1'}]
                },
            ]
        },
        {
            workNumber: '2',
            canOpen: true,
            isOpen: true,
            rowValues: [{value: 'Значение 2'}, {value: 'Значение 2'}],
            children: [
                {
                    workNumber: '2.1',
                    level: '2',
                    rowValues: [{value: 'Значение 2.1'}, {value: 'Значение 2.1'}]
                },
            ]
        },
    ]
    const [tableData, setTableData] = useState<ITableRowProps[]>(()=> initialValues  || defaultData);

    const updateTableData = useCallback((updater: (data: ITableRowProps[]) => ITableRowProps[]) => {
        setTableData(prev => updater([...prev]));
    }, []);

    const generateWorkNumber = useCallback((parentRow: ITableRowProps | null, level: string, existingChildren?: ITableRowProps[]) => {
        if (!parentRow) return 'temp'

        const children = existingChildren || parentRow.children || [];

        if (level === '2') {
            const parentNum = parentRow.workNumber.split('.')[0];
            return `${parentNum}.${children.length + 1}`;
        } else if (level === '3') {
            const parts = parentRow.workNumber.split('.');
            const parentNum = parts.slice(0, 2).join('.');
            return `${parentNum}.${children.length + 1}`;
        }

        return `${children.length + 1}`;
    }, [])

    const findRow = useCallback((
        items: ITableRowProps[],
        id: string,
        parent?: ITableRowProps
    ): { row: ITableRowProps; parent?: ITableRowProps } | null => {
        for (const item of items) {
            if (item.workNumber === id) return { row: item, parent };
            if (item.children) {
                const res = findRow(item.children, id, item);
                if (res) return res;
            }
        }
        return null;
    }, []);

    const renumberTable = useCallback((items: ITableRowProps[], parentNum: string = ''): ITableRowProps[] => {
        return items.map((item, index) => {
            const newWorkNumber = parentNum ? `${parentNum}.${index + 1}` : `${index + 1}`;

            const hasChildren = item.children && item.children.length > 0;
            //const shouldUpdateCanOpen = item.canOpen && !hasChildren;

            const updatedItem = {
                ...item,
                workNumber: newWorkNumber,
                canOpen: hasChildren,
                isOpen: hasChildren ? item.isOpen : false,
            };

            if (item.children) {
                updatedItem.children = renumberTable(item.children, newWorkNumber);
            }

            return updatedItem;
        });
    }, []);
    
    const addRow = useCallback((rowId: string, isChild: boolean = false) => {
        const result = findRow(tableData, rowId);
        if (!result) return;

        const { row } = result;
        const currentLevel = row.level || '1';

        if (isChild && currentLevel === '3') {
            return;
        }

        const newLevel = isChild ? (currentLevel === '1' ? '2': '3') : currentLevel;

        const newRow: ITableRowProps = {
            workNumber: '',
            canOpen: false,
            level: newLevel as '1'|'2'|'3',
            rowValues: [{ value: 'Новое значение' }, { value: 'Новое значение' }]
        };

        updateTableData(data => {
            if (isChild) {
                // Добавляем дочернюю строку
                return data.map(item => {
                    if (item.workNumber === rowId) {
                        const children = item.children || [];
                        newRow.workNumber = generateWorkNumber(item, newLevel, children);
                        return {
                            ...item,
                            canOpen: true,
                            isOpen: true,
                            children: [...children, newRow]
                        };
                    }

                    // Рекурсивно ищем в детях
                    if (item.children) {
                        const updatedChildren = item.children.map(child => {
                            if (child.workNumber === rowId) {
                                const grandChildren = child.children || [];
                                newRow.workNumber = generateWorkNumber(child, newLevel, grandChildren);
                                return {
                                    ...child,
                                    canOpen: true,
                                    isOpen: true,
                                    children: [...grandChildren, newRow]
                                };
                            }
                            return child;
                        });
                        return {...item, children: updatedChildren};
                    }

                    return item;
                });
            } else {
                // Добавляем строку после текущей на том же уровне
                const insertRowRecursive = (items: ITableRowProps[], currentParent: ITableRowProps | null = null): { items: ITableRowProps[], found: boolean } => {
                    const newItems: ITableRowProps[] = [];
                    let found = false;

                    for (const item of items) {
                        // Создаем копию элемента
                        const itemCopy = { ...item };

                        // Добавляем текущий элемент в новый массив
                        newItems.push(itemCopy);

                        // Если нашли целевую строку, добавляем новую строку после нее
                        if (item.workNumber === rowId && !found) {
                            newRow.workNumber = generateWorkNumber(currentParent, currentLevel);
                            newItems.push(newRow);
                            found = true;
                        }

                        // Рекурсивно обрабатываем детей только если еще не нашли строку
                        if (item.children && !found) {
                            const result = insertRowRecursive(item.children, item);
                            itemCopy.children = result.items;
                            found = result.found;
                        } else if (item.children) {
                            // Если уже нашли, просто копируем детей без изменений
                            itemCopy.children = [...item.children];
                        }
                    }

                    return { items: newItems, found };
                };

                const result = insertRowRecursive(data, null);

                return renumberTable(result.items);
            }
        });
    }, [findRow, generateWorkNumber, renumberTable, tableData, updateTableData]);

    const deleteRow = useCallback((rowId: string) => {
        updateTableData(data => {
            const deleteRecursive = (items: ITableRowProps[]): ITableRowProps[] => {
                return items.filter(item => {
                    if (item.workNumber === rowId) {
                        return false; // Удаляем найденную строку
                    }
                    if (item.children) {
                        item.children = deleteRecursive(item.children);
                    }
                    return true;
                });
            };

            const dataAfterDelete = deleteRecursive(data);
            return renumberTable(dataAfterDelete);
        });
    }, [renumberTable, updateTableData]);

    const handleToggle = useCallback((rowId: string) => {
        updateTableData(data => {
            const toggleRecursive = (items: ITableRowProps[]): ITableRowProps[] => {
                return items.map(item => {
                    if (item.workNumber === rowId) {
                        return { ...item, isOpen: !item.isOpen };
                    }
                    if (item.children) {
                        return {
                            ...item,
                            children: toggleRecursive(item.children)
                        };
                    }
                    return item;
                });
            };

            return toggleRecursive(data);
        });
    }, [updateTableData]);

    return {
        tableData,
        setTableData,
        updateTableData,
        addRow,
        deleteRow,
        findRow,
        handleToggle,
        renumberTable,
    };
}
export { useTableData };