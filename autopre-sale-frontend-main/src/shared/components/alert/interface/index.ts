import type {ComponentProps} from "react";
import type {VariantProps} from "class-variance-authority";
import type {alertVariants} from "@shared/components/alert/style";
import type {EAlertType} from "@shared/enum/alert";

interface IAlertProps extends ComponentProps<'div'>, VariantProps<typeof alertVariants>{
    id: string;
    message?: string;
    onClose: (id: string) => void;
    type: EAlertType
}

export type {IAlertProps}