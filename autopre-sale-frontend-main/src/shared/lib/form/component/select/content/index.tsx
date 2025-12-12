import type {ISelectFieldProps} from "../interface";
import {useFormFieldState} from "@shared/lib/form/hooks";
import {cn} from "@shared/lib/cn";
import style from '../style/select.module.css'
import {Label} from "@shared/components/form/label/content";

const SelectField = ({
                         label,
                         className,
                         options,
                         placeholder = "Выберите значение",
                         disabled = false,
                         required = false,
                         ...props
                     }: ISelectFieldProps) => {
    const { field, value, errors } = useFormFieldState<string>();
    const errorMessage = errors[0]?.message;

    return (
        <div className={cn(style.wrapper, className)}>
            {label && (
                <Label>
                    {label}
                </Label>
            )}
            <select
                id={field.name}
                name={field.name}
                className={cn(
                    style.select,
                    errorMessage && style.error,
                    disabled && style.disabled
                )}
                value={value || ''}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={disabled}
                required={required}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}

                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                    >
                        {option.label}
                    </option>
                ))}
            </select>

            {errorMessage && (
                <Label error className={style.errorMessage}>
                    {errorMessage}
                </Label>
            )}
        </div>
    );
};

export { SelectField };