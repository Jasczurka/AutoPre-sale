import type {ComponentProps} from "react";

interface ITextAreaProps extends ComponentProps<'textarea'> {
    label?: string;
    required?: boolean;
}

export type {ITextAreaProps}