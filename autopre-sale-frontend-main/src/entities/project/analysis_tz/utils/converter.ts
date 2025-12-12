import type {
    ITableFieldPropsDto,
    ITableRowPropsDto,
    IWorkDto,
    IWorkImportItem
} from "@entities/project/analysis_tz/interface";

const DEFAULT_COLUMNS = ['№ работы', 'Тип работы', 'Критерии приемки'];

// Конвертация из WorkDto (API) в ITableRowPropsDto (клиент)
const workDtoToTableRowDto = (work: IWorkDto): ITableRowPropsDto => {
    const levelMap: Record<number, '1' | '2' | '3'> = {
        1: '1',
        2: '2',
        3: '3'
    };

    // Преобразуем данные работы в значения ячеек таблицы
    const rowValues: ITableFieldPropsDto[] = [
        { value: work.workType || '' },
        { value: work.acceptanceCriteria || '' }
    ];

    return {
        workNumber: work.workNumber,
        level: levelMap[work.level] || '1',
        rowValues,
        children: work.childWorks?.map(child => workDtoToTableRowDto(child))
    };
};

// Конвертация из ITableRowPropsDto (клиент) в WorkDto (API)
const tableRowDtoToWorkDto = (row: ITableRowPropsDto, parentLevel: number = 0): IWorkDto => {
    const levelMap: Record<string, number> = {
        '1': 1,
        '2': 2,
        '3': 3
    };

    // Извлекаем данные из ячеек таблицы
    // Предполагаем, что ячейки расположены в определенном порядке
    const workNumber = row.workNumber || '';
    const workType = row.rowValues?.[1]?.value || '';
    const acceptanceCriteria = row.rowValues?.[2]?.value || '';

    return {
        id: '', // ID будет генерироваться на сервере
        workNumber,
        level: levelMap[row.level || '1'] || parentLevel + 1,
        workType,
        acceptanceCriteria,
        childWorks: row.children?.map(child => tableRowDtoToWorkDto(child, levelMap[row.level || '1']))
    };
};

// Конвертация для импорта (специфичный формат для ImportBacklogDto)
const tableRowDtoToWorkImportItem = (row: ITableRowPropsDto): IWorkImportItem => {
    const type = row.rowValues?.[1]?.value || '';
    const acceptanceCriteria = row.rowValues?.[2]?.value || '';

    return {
        work_number: row.workNumber,
        work_type: type,
        acceptance_criteria: acceptanceCriteria
    };
};

// Массовые преобразования
const workDtosToTableRowDtos = (works: IWorkDto[]): ITableRowPropsDto[] => {
    return works.map(workDtoToTableRowDto);
};

const tableRowDtosToWorkDtos = (rows: ITableRowPropsDto[]): IWorkDto[] => {
    return rows.map(row => tableRowDtoToWorkDto(row));
};

const tableRowDtosToWorkImportItems = (rows: ITableRowPropsDto[]): IWorkImportItem[] => {
    return rows.map(tableRowDtoToWorkImportItem);
};

// Вспомогательная функция для получения конфигурации таблицы
const getTableColumnsConfig = () => {
    return {
        columnCount: DEFAULT_COLUMNS.length,
        headers: DEFAULT_COLUMNS,
        columnWidths: ['150px', '200px', '400px'] // Настройте по необходимости
    };
};

export {
    workDtoToTableRowDto,
    tableRowDtoToWorkDto,
    tableRowDtoToWorkImportItem,
    workDtosToTableRowDtos,
    tableRowDtosToWorkDtos,
    tableRowDtosToWorkImportItems,
    getTableColumnsConfig
}