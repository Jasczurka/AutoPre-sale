import type { ITextFieldProps } from '../interface'
import { Input } from '@shared/components/form/input'
//import { Label } from '@/app/ui/components/form/label'
//import { cn } from '@/app/utils/cn'
//import { pVariants } from '@/app/ui/components/form/paragraph/style'
import { useFormFieldState } from '@shared/lib/form/hooks'
import {Label} from "@shared/components/form/label/content";
import {cn} from "@shared/lib/cn";
//import {cn} from "@shared/lib/cn";
//import {TooltipWrapper} from "@/app/ui/components/form/tooltip/component"
//import Icon from "@mdi/react"
//import { mdiEye, mdiEyeOff } from '@mdi/js'
import {head} from 'es-toolkit'
//import {useBoolean} from '@/app/common/hooks/use-boolean'

const TextField = ({
                       label,
                       className,
                       disabled = false,
                       onBlur,
                       ...props
                   }: ITextFieldProps) => {
    const { field, value, errors } = useFormFieldState<string>()
    const errorMessages: string[] = errors.map((e) => e.message)
    const firstError = head(errorMessages)
    //const { value: isPasswordShown, toggle: togglePasswordVisibility } = useBoolean(false)
    //const isPassword = type === 'password'
    //const inputType = isPassword ? (isPasswordShown ? 'text' : 'password') : type
    //const rightIcon = isPassword ? (
    //    <button
    //        type="button"
    //        onClick={togglePasswordVisibility}
    //        className="pointer-events-auto text-muted-foreground"
    //    >
    //        {isPasswordShown ? <Icon path={mdiEyeOff} className=" w-[20px] h-auto" />
    //            : <Icon path={mdiEye} className=" w-[20px] h-auto" />
    //        }
    //    </button>
    //) : undefined

    const inputElement = (
        <Input
            {...props}
            //type={inputType}
            value={value}
            onBlur={onBlur ?? field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            disabled={disabled}
            //state={state}
            //rightIcon={rightIcon}
        />
    )

    return (
        <div className={cn('flex flex-col gap-1', className)}>
            {label && <Label>{label}</Label>}
            { inputElement }
            {firstError && <Label error>{firstError}</Label>}
        </div>
    )
}

export { TextField }
