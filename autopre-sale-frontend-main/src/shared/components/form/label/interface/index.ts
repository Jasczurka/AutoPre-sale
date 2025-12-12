import type {ComponentProps} from "react";
import type {labelVariants} from "@shared/components/form/label/style";
import type {VariantProps} from "class-variance-authority";

interface ILabelProps
    extends ComponentProps<'label'>,
        VariantProps<typeof labelVariants>
{

}

export type {ILabelProps}