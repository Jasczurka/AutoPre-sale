import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '@shared/lib/form/context' // путь к useFieldContext
import type { IStateVariant } from '@shared/lib/form/types'

const useFormFieldState = <T = string>() => {
    const field = useFieldContext<T>()

    const value = useStore(field.store, (state) => state.value)
    const isTouched = useStore(field.store, (state) => state.meta.isTouched)
    const errors = useStore(field.store, (state) => state.meta.errors)

    const hasError = isTouched && errors.length > 0
    const isSuccess = isTouched && !hasError && value !== ''

    const state: IStateVariant = hasError
        ? 'error'
        : isSuccess
            ? 'success'
            : 'default'

    return {
        field,
        value,
        isTouched,
        errors,
        state,
    }
}

export { useFormFieldState }
