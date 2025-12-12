enum EExportType {
    Csv = 'Csv',
    Xlsx = 'Xlsx'
}

interface ITableFieldPropsDto {
    value: string;
}

interface IWorkImportItem {
    work_number: string;
    work_type: string;
    acceptance_criteria?: string;
}

interface IWorkDto {
    id: string;
    workNumber: string;
    level: number;
    workType?: string;
    acceptanceCriteria?: string;
    childWorks?: IWorkDto[];
}

interface ITableRowPropsDto  {
    workNumber: string;
    level?: '1' | '2' | '3';
    rowValues?: ITableFieldPropsDto[];
    children?: ITableRowPropsDto[] | undefined;
}

interface IBacklogDTO {
    fileName?: string;
    fileUrl?: string;
    backlogData?: ITableRowPropsDto[];
}

interface IProjectInfoDTO {
    projectId: string;
    projectName: string;
    hasAnalysis: boolean;
}

interface ISaveResponseDTO {
    status: "OK" | "ERROR";
    message?: string;
}

interface IUploadResponseDTO {
    success: boolean;
    data?: IBacklogDTO;
    error?: string;
}

// Re-export from subdirectories
export type {
    IAnalysisTZResponse,
    ISaveBacklogResponse,
    IUploadFileResponse,
    IExportResponseDto,
    IBacklogError
} from "./response";

export type {
    IUploadFilePort,
    IDownloadBacklogPort,
    ISaveBacklogPort
} from "./port";

export type {
    IAnalysisTZRepository
} from "./repository";

export {
    EExportType
}
export type {
    IBacklogDTO,
    IWorkDto,
    IWorkImportItem,
    ISaveResponseDTO,
    IUploadResponseDTO,
    ITableRowPropsDto,
    ITableFieldPropsDto,
    IProjectInfoDTO
}