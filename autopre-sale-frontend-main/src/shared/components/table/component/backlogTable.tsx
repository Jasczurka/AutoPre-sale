import Icon from "@mdi/react";
import {ICON_PATH} from "@shared/components/images/icons";
import type {ITableProps, ITableRowProps} from "../interface";
import React, {useEffect} from "react";
import TableRow from './tableRow'
import useTablePresenter from "@shared/components/table/presenter";


const BacklogTable = ({
    values,
    onDataChange
}: ITableProps) => {
    const {
        data: { filteredData, searchValues, tableData },
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
        search: { handleSearchChange },
        rowOperations: { handleToggle, showContextMenuHandle },
        dragAndDrop: {
            dragOverRow,
            dropPosition,
            handlers: {
                handleDragStart,
                handleDragOver,
                handleDragLeave,
                handleDrop
            },
        }
    } = useTablePresenter(values);

    useEffect(() => {
        console.log(values);
        console.log('Данные обновлены');
    }, [values]);

    useEffect(() => {
        if (onDataChange) {
            onDataChange(tableData);
        }
    }, [tableData, onDataChange]);

    const renderRows = (data: ITableRowProps[], parentLevel: string = '1') => {
        return data.map((item, index) => {
            const rowKey = `${parentLevel}-${item.workNumber}-${index}`;

            const isDragOver = dragOverRow === item.workNumber;
            const currentDropPosition = isDragOver ? dropPosition : null;
            return (
                <React.Fragment key={rowKey}>
                    <TableRow
                        {...item}
                        level={parentLevel as '1' | '2' | '3'}
                        onRowClick={() => handleRowClick(item.workNumber)}
                        onCellDoubleClick={(cellIndex: number) => handleCellDoubleClick(item.workNumber, cellIndex)}
                        onContextMenu={(e: React.MouseEvent) => showContextMenuHandle(e, item.workNumber)}
                        onToggle={() => handleToggle(item.workNumber)}
                        editingCell={editingCell}
                        editingValue={editingValue}
                        onCellEdit={handleCellEdit}
                        onCellEditComplete={handleCellEditComplete}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        isDragOver={isDragOver}
                        dropPosition={currentDropPosition}
                        children={item.children}
                    />
                    {item.isOpen && item.children && renderRows(item.children, String(Number(parentLevel) + 1))}
                </React.Fragment>
            );
        });
    }

    const columnValues = [
        {key: 'workNumber', title: 'Номер работы'},
        {key: 'workType', title: 'Вид работы'},
        {key: 'acceptanceCriteria', title: 'Критерий приемки'},
    ]

    return (
        <table>
            <thead>
                <tr
                    onContextMenu={(e: React.MouseEvent) => showContextMenuHandle(e, '0')}
                >
                    {columnValues.map(({key, title}) =>
                        <th key={key} scope="col">
                            <div>
                                <input
                                    placeholder={title}
                                    tabIndex={0}
                                    value={searchValues[key as keyof typeof searchValues]}
                                    onChange={(e) => handleSearchChange(key as keyof typeof searchValues, e.target.value)}
                                />
                                <Icon path={ICON_PATH.SEARCH} size={1}/>
                            </div>
                        </th>
                    )}
                </tr>
            </thead>
            <tbody>
                {renderRows(filteredData)}
            </tbody>
        </table>
    )
}

export {BacklogTable}