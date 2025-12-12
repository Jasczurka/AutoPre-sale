import {BaseRepository} from "@shared/api/http/BaseRepository.ts";
import type {IProjectRepository} from "@entities/project/interface/repositiry";
import type {IProjectDocumentDto, IProjectDto} from "../../interface/dto";
import type {ICreateProjectPort, IEditProjectPort} from "../../interface/port";
import {EProjectStatus} from "@shared/enum/project";
import {IS_STUB as isStub} from "@shared/api/const";

function getStubProject(id: string, name?: string, clientName?: string, description?: string): IProjectDto {
    return {
        id,
        name: name || `Проект ${id}`,
        clientName: clientName || `Клиент ${id}`,
        status: EProjectStatus.Draft,
        description: description || `Описание проекта ${name || id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documents: undefined,
    }
}

class ProjectRepository extends BaseRepository implements IProjectRepository {
    public async getProjectById(projectId: string): Promise<IProjectDto> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 500));

            const stubProject = getStubProject(projectId);
            return Promise.resolve(stubProject);
        }
        return await this._httpService.get<IProjectDto>(`/api/project-service/Projects/${projectId}`)
    }
    public async getProjects(): Promise<IProjectDto[]> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const stubProjects: IProjectDto[] = [
                getStubProject('1'),
                getStubProject('2'),
                getStubProject('3', 'КИБЕРСТАЛЬ. Комплекс машинного зрения для автоматизированного подсчета длины и количества труб')
            ];
            return Promise.resolve(stubProjects);
        }

        return await this._httpService.get<IProjectDto[]>('/api/project-service/Projects');
    }
    public async createProject(request: ICreateProjectPort): Promise<IProjectDto> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const stubProject: IProjectDto = {
                id: '1',
                name: request.name,
                clientName: request.clientName,
                status: request.status || EProjectStatus.Draft,
                description: request.description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            return Promise.resolve(stubProject);
        }

        return await this._httpService.post<IProjectDto>('/api/project-service/Projects', {
            body: request,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
    public async editProject(project: IEditProjectPort): Promise<IProjectDto> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const existingProject = await this.getProjectById(project.id);

            return Promise.resolve({
                ...existingProject,
                name: project.name || existingProject.name,
                clientName: project.clientName || existingProject.clientName,
                description: project.description || existingProject.description,
                updatedAt: new Date().toISOString(),
            });
        }

        return await this._httpService.put<IProjectDto>(`/api/project-service/Projects/${project.id}`, {
            body: project,
            headers: {
                'Content-Type': 'application/json',
            }
        })
    }

    public async deleteProject(projectId: string): Promise<void> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 600));
            console.log('Удаление проекта:', projectId);
            return Promise.resolve()
        }

        return await this._httpService.delete('/api/project-service/Projects/' + projectId);
    }
    public async uploadProjectDocument(projectId: string, file: File): Promise<IProjectDocumentDto> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const stubDocument: IProjectDocumentDto = {
                id: 'doc-1',
                fileName: file.name,
                fileUrl: `/api/files/${file.name}`,
                uploadedAt: new Date().toISOString(),
                processed: true
            };

            return Promise.resolve(stubDocument);
        }

        const formData = new FormData();
        formData.append('file', file);

        return await this._httpService.post<IProjectDocumentDto>(
            `/api/project-service/Projects/${projectId}/documents`,
            {
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        );
    }
}

export {ProjectRepository}