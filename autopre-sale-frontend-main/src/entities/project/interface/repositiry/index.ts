import type {ICreateProjectPort, IEditProjectPort} from "@entities/project/interface/port";
import type {IProjectDocumentDto, IProjectDto} from "@entities/project/interface/dto";

export interface IProjectRepository {
    getProjectById(projectId: string): Promise<IProjectDto>,
    getProjects(): Promise<IProjectDto[]>,
    createProject(request: ICreateProjectPort): Promise<IProjectDto>,
    editProject(project: IEditProjectPort): Promise<IProjectDto>,
    deleteProject(projectId: string): Promise<void>,
    uploadProjectDocument(projectId: string, file: File): Promise<IProjectDocumentDto>,
}
