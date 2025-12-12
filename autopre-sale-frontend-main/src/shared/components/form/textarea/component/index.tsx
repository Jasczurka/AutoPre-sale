import React, {type FC, useEffect, useRef} from "react";
import {cn} from "@shared/lib/cn";
import type {ITextareaProps} from "@shared/components/form/textarea/interface";
import {textareaVariants} from "@shared/components/form/textarea/style";


const Textarea: FC<ITextareaProps> = ({
    className,
    fitContent,
    value,
    onChange,
    ...props
}) => {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (fitContent && ref.current) {
            const textarea = ref.current;
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    }, [fitContent, value]); // Пересчитываем при изменении значения

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) {
            onChange(e);
        }

        if (fitContent && ref.current) {
            const textarea = ref.current;
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    };

    return (
        <textarea
            ref={ref}
            className={cn(textareaVariants({fitContent}), className)}
            value={value}
            onChange={handleInput}
            {...props}
        />
    )
}

export {Textarea};