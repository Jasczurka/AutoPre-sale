interface IFieldDto {
    id: string;
    name: string;
    label: string;
    value?: string;
    setValue?: (value: string) => void;
    required?: boolean;
}

export type {IFieldDto}
