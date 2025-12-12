import {type IButtonProps, buttonVariants} from "..";
import {cn} from "@shared/lib/cn";


const Button = ({
                    className,
                    children,
                    outline,
                    ...props
                }: IButtonProps) => {
    return(
        <button
            className={cn(buttonVariants({outline}), className)}
            {...props}
        >
            {children}
        </button>
    )
}

export {Button};