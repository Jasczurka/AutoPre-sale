interface ITemplateField {
    type: 'text' | 'list' | 'textarea' | 'number' | 'select' | 'checkbox';
    placeholderName: string;
    label?: string;
    required?: boolean;
    defaultValue?: string | number | boolean;
    options?: Array<{ label: string; value: string }>;
}

interface ITemplateFields {
    [key: string]: ITemplateField;
}

interface ITemplateDto {
    id: string;
    code: string;
    name: string;
    description?: string;
    version: number;
    fields: ITemplateFields;
    fileUrl: string;
    previewUrl?: string;
    createdAt: string;
}

export type {
    ITemplateField,
    ITemplateFields,
    ITemplateDto
}