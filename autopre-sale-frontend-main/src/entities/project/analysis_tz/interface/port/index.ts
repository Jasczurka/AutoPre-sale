import type {ITableRowPropsDto} from "@entities/project/analysis_tz/interface/dto";

interface IUploadFilePort {
    projectId: string;
    file: File;
}

interface ISaveBacklogPort {
    projectId: string;
    backlogData: ITableRowPropsDto[];
}

interface IDownloadBacklogPort {
    projectId: string;
    format: 'xlsx' | 'csv'
}

export type {IUploadFilePort, IDownloadBacklogPort, ISaveBacklogPort};