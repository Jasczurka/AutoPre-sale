import {createFormHook} from "@tanstack/react-form";
import {
    fieldContext,
    formContext
} from "../context";
import {
    SubscribeButton,
    TextField,
    TextareaField,
    SelectField
} from "@shared/lib/form/component";

const { useAppForm } = createFormHook({
    fieldComponents: {
        TextField,
        TextareaField,
        SelectField
    },
    formComponents: {
        SubscribeButton
    },
    fieldContext,
    formContext
})

export { useAppForm }