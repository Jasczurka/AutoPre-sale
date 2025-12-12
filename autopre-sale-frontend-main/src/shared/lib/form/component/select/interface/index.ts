import type { ComponentProps } from "react";

interface ISelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface ISelectFieldProps extends Omit<ComponentProps<'select'>, 'value' | 'onChange'> {
    label?: string;
    required?: boolean;
    options: ISelectOption[];
    placeholder?: string;
    error?: string;
}


export type {ISelectOption, ISelectFieldProps}