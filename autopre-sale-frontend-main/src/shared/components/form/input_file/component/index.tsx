import {buttonVariants} from "@shared/components/form/button";
import {cn} from "@shared/lib/cn";
import type {IInputFileProps} from "@shared/components/form/input_file/interface";

const InputFile = ({
                    id = 'input-file',
                    className,
                    outline,
                    children, onChange,
                    ...props
                }: IInputFileProps) => {
    return(
        <>
            <label htmlFor={id} className={cn(buttonVariants({outline}), className)}>
                {children}
            </label>
            <input
                id={id}
                type="file"
                onChange={onChange}
                style={{ display: "none" }}
                {...props}
            />
        </>
)
}

export {InputFile};