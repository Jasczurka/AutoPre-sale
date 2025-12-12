import type {IStaticTableProps} from "../interface";
import style from '../style/table.module.css';

const StaticTable = ({
    headers=[],
    data=[],
    columnWidths = [],
}: IStaticTableProps) => {

    return (
        <table className={style.static}>
            <thead>
            <tr>
                {headers.map((header, index) =>
                    <th
                        key={index}
                        style={columnWidths[index] ?
                            {width: columnWidths[index]} : undefined}
                    >
                        {header}
                    </th>
                )}
            </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr
                        key={rowIndex}
                    >
                        {row.cells.map((cell, index) => (
                            <td key={index}>
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export {StaticTable}