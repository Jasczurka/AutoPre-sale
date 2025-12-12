import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

const cn = (...inputs: Array<ClassValue>) => {
    return twMerge(clsx(inputs))
}

export { cn }
