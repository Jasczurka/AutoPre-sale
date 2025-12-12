import type {ComponentProps} from "react";
import type {VariantProps} from "class-variance-authority";
import type {textareaVariants} from "@shared/components/form/textarea/style";

interface ITextareaProps
    extends ComponentProps<'textarea'>, VariantProps<typeof textareaVariants>{

}

export type {ITextareaProps};