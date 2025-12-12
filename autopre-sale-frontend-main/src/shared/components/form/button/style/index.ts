import {cva} from "class-variance-authority";
import style from './button.module.css'

export const buttonVariants = cva(
    style.button,
    {
        variants: {
            outline: {
                true: style.outline
            }
        },
        defaultVariants:{

        }
    }
)