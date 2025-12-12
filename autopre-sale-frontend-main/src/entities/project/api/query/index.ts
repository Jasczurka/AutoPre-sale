// entities/project/api/request/useProjectRequests.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectRepository } from "../projectRepository";
import { HTTP_APP_SERVICE } from "@shared/services/http/HttpAppService";
import { EQueryKeys } from "@shared/enum/query";
import type { IProjectDto, IProjectDocumentDto } from "../../interface/dto";
import type {ICreateProjectPort, IEditProjectPort} from "../../interface/port";


const repository = new ProjectRepository(HTTP_APP_SERVICE);

// Хук для получения всех проектов
const useProjectsQuery = () => {
    return useQuery<IProjectDto[], Error>({
        queryKey: [EQueryKeys.PROJECTS+'get-all'],
        queryFn: () => repository.getProjects(),
        staleTime: 5 * 60 * 1000, // 5 минут
    });
};

// Хук для получения проекта по ID
const useProjectQuery = (projectId: string) => {
    return useQuery<IProjectDto, Error>({
        queryKey: [EQueryKeys.PROJECTS, projectId],
        queryFn: () => repository.getProjectById(projectId),
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000,
    });
};

// Хук для создания проекта
const useCreateProjectMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<IProjectDto, Error, ICreateProjectPort>({
        mutationFn: (request) => repository.createProject(request),
        mutationKey: [EQueryKeys.PROJECTS+'createProject'],
        onSuccess: (data) => {
            // Инвалидируем кэш проектов
            queryClient.invalidateQueries({ queryKey: [EQueryKeys.PROJECTS+'get-all'] });
            return data
        },
    });
};

// Хук для загрузки документа проекта
const useUploadProjectDocumentMutation = () => {
    return useMutation<IProjectDocumentDto, Error, { projectId: string; file: File }>({
        mutationFn: ({ projectId, file }) => repository.uploadProjectDocument(projectId, file),
        mutationKey: [EQueryKeys.PROJECTS+'uploadFile'],
    });
};

// Хук для редактирования проекта
const useEditProjectMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<IProjectDto, Error, IEditProjectPort>({
        mutationFn: (request) => repository.editProject(request),
        onSuccess: (data) => {
            // Инвалидируем кэш проектов
            queryClient.invalidateQueries({ queryKey: [EQueryKeys.PROJECTS] });
            // Обновляем конкретный проект в кэше
            queryClient.setQueryData([EQueryKeys.PROJECTS, data.id], data);
        },
    });
};

// Хук для удаления проекта
const useDeleteProjectMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: (projectId) => repository.deleteProject(projectId),
        onSuccess: (_, projectId) => {
            // Инвалидируем кэш проектов
            queryClient.invalidateQueries({ queryKey: [EQueryKeys.PROJECTS] });
            // Удаляем проект из кэша
            queryClient.removeQueries({ queryKey: [EQueryKeys.PROJECTS, projectId] });
        },
    });
};

export {
    useProjectsQuery,
    useProjectQuery,
    useCreateProjectMutation,
    useUploadProjectDocumentMutation,
    useEditProjectMutation,
    useDeleteProjectMutation
}