import {cva} from "class-variance-authority";
import style from './alert.module.css'
import {cn} from "@shared/lib/cn";

const alertVariants = cva(
    style.alert,
    {
        variants: {
            type: {
                success: style.success,
                info: '',
                error: cn(style.error, style.attention),
                warning: cn(style.warning, style.attention)
            },
            visible: {
                true: style.visible,
                false: style.invisible,
            }
        },
        defaultVariants: {
            type: 'info',
            visible: true
        }
    }
)

export {alertVariants}