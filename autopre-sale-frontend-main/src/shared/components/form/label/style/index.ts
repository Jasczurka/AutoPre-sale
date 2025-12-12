import {cva} from "class-variance-authority";
import style from '../style/label.module.css'

const labelVariants = cva(style.label,
    {
        variants: {
            error: {
                true: style.error
            }
        }
    }
)

export {labelVariants}