import {cva} from "class-variance-authority";
import style from './textarea.module.css'

const textareaVariants = cva(
    style.textarea,
    {
        variants:{
            fitContent: {
                true: style.fitContent
            }
        },
        defaultVariants: {
            fitContent: false
        }
    }
)

export {textareaVariants}