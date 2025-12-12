import {
    EExportType,
    type IAnalysisTZResponse, type IExportResponseDto,
    type ISaveBacklogResponse, type IWorkDto
} from "@entities/project/analysis_tz/interface";
import {BaseRepository} from "@shared/api/http/BaseRepository.ts";
import type {
    IAnalysisTZRepository,
    IDownloadBacklogPort,
    ISaveBacklogPort,
} from "@entities/project/analysis_tz/interface";
import {IS_STUB as isStub} from "@shared/api/const";
import {tableRowDtosToWorkDtos, workDtosToTableRowDtos} from "@entities/project/analysis_tz/utils/converter.ts";
import type {IProjectDocumentDto, IProjectDto} from "@entities/project/interface/dto";

const stubWorks: IWorkDto[] = [
    {
        id: "1",
        workNumber: "1",
        level: 1,
        workType: "Разработка",
        acceptanceCriteria: "Функциональность должна соответствовать требованиям",
        childWorks: [
            {
                id: "1.1",
                workNumber: "1.1",
                level: 2,
                workType: "Бэкенд",
                acceptanceCriteria: "API должно работать корректно",
                childWorks: []
            },
            {
                id: "1.2",
                workNumber: "1.2",
                level: 2,
                workType: "Фронтенд",
                acceptanceCriteria: "Интерфейс должен быть удобным",
                childWorks: []
            }
        ]
    }
]


class AnalysisRepository extends BaseRepository implements IAnalysisTZRepository {
    public async getBacklogData(projectId: string): Promise<IAnalysisTZResponse> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 500));

            const backlogData = stubWorks;
            const tableRowDtos = workDtosToTableRowDtos(backlogData);

            if (projectId == '2') {
                return {
                    projectId,
                    projectName: `Проект ${projectId}`,
                };
            }

            return {
                projectId,
                projectName: `Проект ${projectId}`,
                fileName: "technical_specification.docx",
                fileUrl: `/api/files/technical_specification.docx`,
                backlogData: tableRowDtos
            };
        }
        try {
            // Запрос к Backlog API
            const works = await this._httpService.get<IWorkDto[]>(
                `/api/backlog-service/Backlog/${projectId}`
            );

            const tableRowDtos = workDtosToTableRowDtos(works);

            // Здесь нужно также получить информацию о файле ТЗ
            // Предполагаем, что есть отдельный эндпоинт для этого
            const documentInfo = await this.getDocumentInfo(projectId);

            return {
                projectId,
                projectName: documentInfo.projectName || `Проект ${projectId}`,
                fileName: documentInfo.fileName,
                fileUrl: documentInfo.fileUrl,
                backlogData: tableRowDtos.length > 0 ? tableRowDtos : undefined
            };
        } catch (error) {
            console.error('Error fetching backlog:', error);

            // Если бэклога нет (404 или другая ошибка), возвращаем только информацию о проекте
            try {
                const documentInfo = await this.getDocumentInfo(projectId);

                return {
                    projectId,
                    projectName: documentInfo.projectName || `Проект ${projectId}`,
                    fileName: documentInfo.fileName,
                    fileUrl: documentInfo.fileUrl
                    // backlogData будет undefined
                };
            } catch {
                // Если не удалось получить информацию о проекте
                return {
                    projectId,
                    projectName: `Проект ${projectId}`,
                    // fileName и fileUrl будут undefined
                };
            }
        }

        //return await this._httpService.get<IAnalysisTZResponse>(`/api/projects/${projectId}/analysis`);
    }


    // Сохранение бэклога
    public async saveBacklog(port: ISaveBacklogPort): Promise<ISaveBacklogResponse> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                status: "OK",
                message: "Данные успешно сохранены",
                timestamp: new Date().toISOString()
            };
        }

        try {
            // Конвертируем клиентские DTO в API DTO
            const workDtos = tableRowDtosToWorkDtos(port.backlogData);

            // Отправляем на сервер
            await this._httpService.put(
                `/api/backlog-service/Backlog/${port.projectId}`,
                {
                    body: workDtos,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            return {
                status: "OK",
                message: "Данные успешно сохранены",
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error saving backlog:', error);
            return {
                status: "ERROR",
                message: error instanceof Error ? error.message : 'Ошибка сохранения',
                timestamp: new Date().toISOString()
            };
        }
    }

    // Экспорт бэклога
    public async downloadBacklog(port: IDownloadBacklogPort): Promise<Blob> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 500));
            // Возвращаем пустой blob для заглушки
            return new Blob(['Заглушка экспорта'], { type: 'text/plain' });
        }

        try {
            const exportType: EExportType = port.format === 'csv' ? EExportType.Csv : EExportType.Xlsx;

            const response = await this._httpService.get<IExportResponseDto>(
                `/api/backlog-service/Backlog/${port.projectId}/export`,
                {
                    params: { type: exportType }
                }
            );

            // Если сервер возвращает URL, скачиваем по нему
            if (response.url) {
                const blobResponse = await fetch(response.url);
                return await blobResponse.blob();
            }

            throw new Error('URL для скачивания не получен');
        } catch (error) {
            console.error('Error exporting backlog:', error);
            throw new Error(`Ошибка экспорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    }

    private async getDocumentInfo(projectId: string): Promise<{
        projectName: string;
        fileName?: string;
        fileUrl?: string;
    }> {
        if (isStub) {
            return {
                projectName: `Проект ${projectId}`,
                fileName: "technical_specification.docx",
                fileUrl: `/api/files/technical_specification.docx`
            };
        }

        // Здесь нужно получить информацию о проекте и документе
        try {
            // Предполагаем, что есть эндпоинт для получения проекта
            const project = await this._httpService.get<IProjectDto>(`/api/project-service/Projects/${projectId}`);

            // Здесь нужно также получить информацию о документе ТЗ
            // Это может быть отдельный запрос или часть ответа проекта
            // Предположим, что есть эндпоинт для получения документов проекта
            try {
                const documents = await this._httpService.get<IProjectDocumentDto[]>(
                    `/api/project-service/Projects/${projectId}/documents`
                );

                // Ищем документ ТЗ (может быть фильтр по типу)
                const tzDocument = documents.find(doc =>
                    doc.fileName?.includes('tz') ||
                    doc.fileName?.includes('техническое') ||
                    doc.fileName?.includes('specification')
                );

                return {
                    projectName: project.name,
                    fileName: tzDocument?.fileName,
                    fileUrl: tzDocument?.fileUrl
                };
            } catch {
                // Если не удалось получить документы
                return {
                    projectName: project.name
                };
            }
        } catch {
            // Если не удалось получить проект
            return {
                projectName: `Проект ${projectId}`
            };
        }
    }
}

export {AnalysisRepository}