import {useQuery} from "@tanstack/react-query";
import {TemplateRepository} from "@entities/block_template/templateRepository";
import {HTTP_APP_SERVICE} from "@shared/services/http/HttpAppService.ts";
import type {IGetTemplatesResponse} from "@entities/block_template/interface/index.response.ts";

const repository = new TemplateRepository(HTTP_APP_SERVICE)

const useGetAllTemplates = () => {
    return useQuery<IGetTemplatesResponse, Error>({
        queryKey: ['template:get-all'],
        queryFn: () => repository.getTemplates(),
        staleTime: 60 * 60 * 1000,
    })
}


export {useGetAllTemplates}