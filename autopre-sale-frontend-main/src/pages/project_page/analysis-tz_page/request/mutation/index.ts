import {AnalysisRepository} from "@entities/project/analysis_tz/api/AnalysisRepository.ts";
import {HTTP_APP_SERVICE} from "@shared/services/http/HttpAppService.ts";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import type {
    IDownloadBacklogPort,
    ISaveBacklogPort,
    ISaveBacklogResponse,
} from "@entities/project/analysis_tz/interface";
import {EQueryKeys} from "@shared/enum/query";


const repository = new AnalysisRepository(HTTP_APP_SERVICE);


// Мутация для сохранения бэклога
function useSaveBacklogMutation() {
    const queryClient = useQueryClient();

    return useMutation<ISaveBacklogResponse, Error, ISaveBacklogPort>({
        mutationFn: (port: ISaveBacklogPort) => repository.saveBacklog(port),
        onSuccess: (_, variables) => {
            // Инвалидируем кэш после успешного сохранения
            queryClient.invalidateQueries({
                queryKey: [EQueryKeys.ANALYSIS_TZ, variables.projectId]
            });

            // Можно также обновить кэш оптимистично
            //queryClient.setQueryData(
            //    [EQueryKeys.ANALYSIS_TZ, variables.projectId],
            //    (oldData: IAnalysisTZResponse | undefined) => {
            //        if (!oldData) return oldData;
            //        return {
            //            ...oldData,
            //            backlogData: port.backlogData
            //        };
            //    }
            //);
        },
        onError: (error, variables) => {
            console.error('Error saving backlog:', error);
            // При ошибке можно откатить оптимистичное обновление
            queryClient.invalidateQueries({
                queryKey: [EQueryKeys.ANALYSIS_TZ, variables.projectId]
            });
        },
    });
}

// Мутация для скачивания бэклога
function useDownloadBacklogMutation() {
    return useMutation<Blob, Error, IDownloadBacklogPort>({
        mutationFn: (port: IDownloadBacklogPort) => repository.downloadBacklog(port),
        onError: (error) => {
            console.error('Error downloading backlog:', error);
        },
    });
}


// Общий хук для всех мутаций
function useAnalysisPageMutation() {
    const saveMutation = useSaveBacklogMutation();
    const downloadMutation = useDownloadBacklogMutation();

    return {
        saveBacklog: saveMutation.mutateAsync,
        saveBacklogStatus: saveMutation,
        downloadBacklog: downloadMutation.mutateAsync,
        downloadBacklogStatus: downloadMutation,

        // Состояния для UI
        isSaving: saveMutation.isPending,
        isDownloading: downloadMutation.isPending,

        // Ошибки
        saveError: saveMutation.error,
        downloadError: downloadMutation.error,
    };
}

export { useAnalysisPageMutation };