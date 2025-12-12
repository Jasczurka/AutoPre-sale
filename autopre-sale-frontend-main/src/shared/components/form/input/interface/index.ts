import type {ComponentProps} from "react";
import type {VariantProps} from "class-variance-authority";
import type {inputVariants} from "@shared/components/form/input/style";

interface IInputProps
    extends ComponentProps<'input'>,
        VariantProps<typeof inputVariants>{
    
}

export type { IInputProps }
