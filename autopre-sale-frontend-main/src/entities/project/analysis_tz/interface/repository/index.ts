import type {
    IAnalysisTZResponse,
    IDownloadBacklogPort, ISaveBacklogPort,
    ISaveBacklogResponse,
} from "@entities/project/analysis_tz/interface";

export interface IAnalysisTZRepository {
    getBacklogData(projectId: string): Promise<IAnalysisTZResponse>,
    saveBacklog(port: ISaveBacklogPort): Promise<ISaveBacklogResponse>,
    downloadBacklog(port: IDownloadBacklogPort): Promise<Blob>
}
