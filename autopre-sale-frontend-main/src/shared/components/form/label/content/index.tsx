import type {ILabelProps} from "@shared/components/form/label/interface";
import {labelVariants} from "@shared/components/form/label/style";
import {cn} from "@shared/lib/cn";

const Label = ({
    error,
    children,
    className,
    ...props
}: ILabelProps) => {
    return (
        <span className={cn(labelVariants({error}), className)} {...props}>
            {children}
        </span>
    )
}

export { Label }