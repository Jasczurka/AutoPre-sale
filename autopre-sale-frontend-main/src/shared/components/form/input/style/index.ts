import {cva} from "class-variance-authority";
import style from './input.module.css'

const inputVariants = cva(
    style.input,
    {
        variants: {
            isSearch: { true: style.search }
        },
        defaultVariants: {
            isSearch: false
        }
    }
)

export {inputVariants}