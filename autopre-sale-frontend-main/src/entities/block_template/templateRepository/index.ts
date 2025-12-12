import {BaseRepository} from "@shared/api/http/BaseRepository.ts";
import type {ITemplateRepository} from "@entities/block_template/interface/index.repository.ts";
import {STUB_TEMPLATES} from '../stub'
import { IS_STUB as isStub } from "@shared/api/const";
import type {
    ICreateTemplatePort, IGetTemplateByIdPort
} from "@entities/block_template/interface/index.port.ts";
import type {
    ICreateTemplateResponse, IGetTemplateByIdError, IGetTemplateResponse, IGetTemplatesResponse
} from "@entities/block_template/interface/index.response.ts";
import type {ITemplateDto, ITemplateFields} from "@entities/block_template/interface/index.dto.ts";


class TemplateRepository  extends BaseRepository implements ITemplateRepository {
    // Создание шаблона
    public async createTemplate(port: ICreateTemplatePort): Promise<ICreateTemplateResponse> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const newTemplate: ITemplateDto = {
                id: `stub-${Date.now()}`,
                code: port.code,
                name: port.name,
                description: port.description,
                version: port.version || 1,
                fields: port.fields as ITemplateFields,
                fileUrl: `/api/templates/files/${port.code}.pptx`,
                previewUrl: `/api/templates/previews/${port.code}.png`,
                createdAt: new Date().toISOString()
            };

            STUB_TEMPLATES.push(newTemplate);

            return { template: newTemplate };
        }

        //const formData = port.toFormData();

        return await this._httpService.post<ICreateTemplateResponse>('/api/Templates', {
            body: port,
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    }

    // Получение шаблона по ID
    public async getTemplateById(port: IGetTemplateByIdPort): Promise<IGetTemplateResponse> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 500));

            const template = STUB_TEMPLATES.find(t => t.id === port.id);

            if (!template) {
                const error: IGetTemplateByIdError = {
                    code: "INVALID_ID",
                    message: `Template with id ${port.id} not found`
                };
                throw error;
            }

            return { template };
        }

        return await this._httpService.get<IGetTemplateResponse>(`/api/Templates/${port.id}`);
    }

    // Получение всех шаблонов с фильтрацией
    public async getTemplates(): Promise<IGetTemplatesResponse> {
        if (isStub) {
            await new Promise(resolve => setTimeout(resolve, 300));

            return {
                templates: STUB_TEMPLATES,
            };
        }

        //const queryParams = port?.toQueryParams() || {};

        return await this._httpService.get<IGetTemplatesResponse>('/api/Templates');
    }
}

export {TemplateRepository }