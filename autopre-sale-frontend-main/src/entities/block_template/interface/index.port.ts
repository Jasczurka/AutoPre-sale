import type {ITemplateFields} from "@entities/block_template/interface/index.dto.ts";

interface ICreateTemplatePort {
    file: File;
    name: string;
    code: string;
    description?: string;
    version?: number;
    fields: ITemplateFields;
}

interface IGetTemplateByIdPort {
    id: string;
}

export type {
    ICreateTemplatePort,
    IGetTemplateByIdPort,
}