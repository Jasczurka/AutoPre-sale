import type {ITableRowProps} from "@shared/components/table/interface";
import React, {useEffect, useRef} from "react";
import style from "../style/table.module.css";
import Icon from "@mdi/react";
import {ICON_PATH} from "@shared/components/images/icons";

const TableRow = ({
                      workNumber = '1',
                      canOpen = false,
                      level = '1',
                      isOpen = false,
                      rowValues = [{value: "Значение1"}],
                      children,
                      onRowClick,
                      onCellDoubleClick,
                      onContextMenu,
                      onToggle,
                      editingCell,
                      editingValue,
                      onCellEdit,
                      onCellEditComplete,

                      onDragStart,
                      onDragOver,
                      onDragLeave,
                      onDrop,
                      isDragOver = false,
                      dropPosition = null
                  }: ITableRowProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isEditing = editingCell?.rowId === workNumber;

    const rowClassName = [
        isDragOver ? style.dragOver : '',
        dropPosition === 'after' ? style.dropAfter : '',
        dropPosition === 'before' ? style.dropBefore : '',
        dropPosition === 'inside' ? style.dropInside : ''
    ].filter(Boolean).join(' ');

    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle?.();
    }
    useEffect(()=>{
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
            adjustTextareaHeight();
        }
    }, [isEditing])

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onCellEditComplete?.();
        } else if (e.key === 'Escape') {
            onCellEditComplete?.();
        }
    }

    const handleRowKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isEditing && canOpen && e.currentTarget === e.target) {
            e.preventDefault();
            onToggle?.();
        }
    };

    const handleCellKeyDown = (e: React.KeyboardEvent, cellIndex: number) => {
        if (e.key === 'Enter' && !isEditing) {
            e.preventDefault();
            onCellDoubleClick?.(cellIndex);
        }
    };

    const handleBlur = () => {
        onCellEditComplete?.();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>)=> {
        onCellEdit?.(e.target.value);
        adjustTextareaHeight()
    }

    return (
        <tr
            className={rowClassName}
            onClick={onRowClick}
            onContextMenu={onContextMenu}
            onKeyDown={handleRowKeyDown}
            tabIndex={0}
            draggable={true}
            onDragStart={(e) => onDragStart?.(e, {
                workNumber,
                canOpen,
                level,
                isOpen,
                rowValues,
                children
            })}
            onDragOver={(e) => onDragOver?.(e, workNumber)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop?.(e, workNumber)}
        >
            <th
                className={canOpen ? style.haveBtn : ''}
            >
                <div
                    className={level == '2' ? style.secondLvl : level == '3' ? style.thirdLvl : ""}
                >
                    {canOpen &&
                        <button
                            id={workNumber}
                            className={style.btn}
                            onClick={handleButtonClick}
                            tabIndex={-1}
                        >
                            <Icon path={isOpen ? ICON_PATH.REMOVE : ICON_PATH.ADD}/>
                        </button>
                    }
                    <label htmlFor={workNumber}>{workNumber}</label>
                </div>
            </th>
            {rowValues.map((item, index) => {
                const isCellEditing = isEditing && editingCell?.cellIndex === index;

                return (
                    <td
                        key={index}
                        tabIndex={0}
                        onDoubleClick={() => onCellDoubleClick?.(index)}
                        onKeyDown={(e) => handleCellKeyDown(e, index)}
                        className={style.editableCell + ' ' + (isCellEditing && style.selected)}
                    >
                        {isCellEditing ? (
                            <textarea
                                ref={textareaRef}
                                tabIndex={0}
                                value={editingValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onBlur={handleBlur}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (item.value)
                        }
                    </td>
                )
            })}
        </tr>
    )
}

export default TableRow