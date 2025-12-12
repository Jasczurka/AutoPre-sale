import type {IInputProps} from "@shared/components/form/input/interface";
import {cn} from "@shared/lib/cn";
import {inputVariants} from "@shared/components/form/input/style";

const Input = ({
                   className,
                   type = 'text',
                    isSearch,
                   ...props
               }: IInputProps) => {
    return (
    <input
        type={type}
        data-slot="input"
        className={cn(className, inputVariants({isSearch}))}
        {...props}
    />
    )
}

Input.displayName = 'Input'
export { Input }
