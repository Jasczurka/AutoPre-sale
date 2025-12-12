import {useQuery, type UseQueryResult} from "@tanstack/react-query";
import type {IAnalysisTZResponse} from "@entities/project/analysis_tz/interface";
import {AnalysisRepository} from "@entities/project/analysis_tz/api/AnalysisRepository.ts";
import {HTTP_APP_SERVICE} from "@shared/services/http/HttpAppService.ts";
import {EQueryKeys} from "@shared/enum/query";

type IAnalysisPageRequestResult = UseQueryResult<IAnalysisTZResponse, Error>

interface IAnalysisPageRequestOptions {
    enabled?: boolean;
    projectId: string;
}

const repository = new AnalysisRepository(HTTP_APP_SERVICE);

function useAnalysisPageRequest({
                                    enabled = true,
                                    projectId,
                                }: IAnalysisPageRequestOptions): IAnalysisPageRequestResult {

    const callback = async () => {
        try {
            return await repository.getBacklogData(projectId);
        } catch (error) {
            console.error('Error fetching backlog data:', error);

            // Если ошибка 404 (бэклог не найден), возвращаем структуру без бэклога
            if (error?.status === 404) {
                return {
                    projectId,
                    projectName: `Проект ${projectId}`,
                    // fileName и fileUrl будут undefined
                    // backlogData будет undefined
                };
            }

            throw error;
        }
    };

    return useQuery({
        queryKey: [EQueryKeys.ANALYSIS_TZ, projectId],
        queryFn: callback,
        enabled: enabled && !!projectId,
        staleTime: 5 * 60 * 1000, // 5 минут
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: 1,
        // Опционально: кэшируем на диске
        // persist: true,
    });
}

export {useAnalysisPageRequest}