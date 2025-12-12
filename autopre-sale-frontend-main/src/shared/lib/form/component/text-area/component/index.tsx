import {useFormFieldState} from "@shared/lib/form/hooks";
import {head} from "es-toolkit";
import type {ITextAreaProps} from "@shared/lib/form/component/text-area/interface";
import {Label} from "@shared/components/form/label/content";
import {cn} from "@shared/lib/cn";
import style from '../style/textarea.module.css'
import {Textarea} from "@shared/components/form/textarea";

const TextareaField = ({
    label,
    className,
    onBlur,
    disabled = false,
    ...props
}: ITextAreaProps) => {
    const { field, value, errors } = useFormFieldState<string>()
    const errorMessages: string[] = errors.map((e)=> e.massage)
    const firstError = head(errorMessages)

    const textareaElement = (
        <Textarea
            {...props}
            value={value}
            onBlur={onBlur ?? field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            disabled ={disabled}
        />
    )

    return (
        <div className={cn(style.wrapper, className)}>
            {label && <Label>{label}</Label>}
            { textareaElement }
            {firstError && <Label error>{firstError}</Label>}
        </div>
    )
}

export {TextareaField}