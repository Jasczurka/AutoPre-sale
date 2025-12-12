import { Button, type IButtonProps } from '@shared/components/form/button'
import { useFormContext } from '@shared/lib/form'

const SubscribeButton = (props: IButtonProps) => {
    const form = useFormContext()
    return (
        <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
                <Button {...props} type="submit" disabled={isSubmitting} />
            )}
        </form.Subscribe>
    )
}

export { SubscribeButton }
