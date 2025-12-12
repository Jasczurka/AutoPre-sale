import type {IStaticTableProps} from "@shared/components/table/interface";

const DEF_TABLE_DATA : IStaticTableProps = {
    headers:[
        'Заголовок 1', "Заголовок 3"
    ],
    data:[
        {
            id: '1',
            cells: [
                "Текст1", "Текст2"
            ]
        },{
            id: '2',
            cells: [
                "Текст1", "Текст2"
            ]
        }
    ],
    columnWidths: [
        '100%', '100%'
    ],
}

export {
    DEF_TABLE_DATA,
}