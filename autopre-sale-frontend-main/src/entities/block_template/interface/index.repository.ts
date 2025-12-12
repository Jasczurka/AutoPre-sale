import type {
    ICreateTemplatePort, IGetTemplateByIdPort
} from "./index.port.ts";
import type {
    ICreateTemplateResponse, IGetTemplateResponse, IGetTemplatesResponse,
} from "./index.response.ts";

interface ITemplateRepository {
    // CRUD операции
    createTemplate(port: ICreateTemplatePort): Promise<ICreateTemplateResponse>;
    getTemplateById(port: IGetTemplateByIdPort): Promise<IGetTemplateResponse>;
    getTemplates(): Promise<IGetTemplatesResponse>;
}

export type {ITemplateRepository}