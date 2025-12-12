import type {ITemplateDto} from "@entities/block_template/interface/index.dto.ts";

interface ICreateTemplateResponse {
    template: ITemplateDto;
}

interface IGetTemplatesResponse {
    templates: ITemplateDto[];
}

interface IGetTemplateResponse {
    template: ITemplateDto;
}

interface ICreateTemplateError {
    code?: string | null;
    message?: string | null;
}

interface IGetTemplatesError {
    code?: string | null;
    message?: string | null;
}

interface IGetTemplateByIdError {
    code?: string | null;
    message?: string | null;
}

export type {
    ICreateTemplateResponse,
    IGetTemplatesResponse,
    IGetTemplateResponse,
    ICreateTemplateError,
    IGetTemplatesError,
    IGetTemplateByIdError
}