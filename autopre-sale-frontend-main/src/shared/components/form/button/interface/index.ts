import type {ComponentProps} from "react";
import type {VariantProps} from "class-variance-authority";
import {buttonVariants} from "@shared/components/form/button/style";

interface IButtonProps
    extends ComponentProps<'button'>,
        VariantProps<typeof buttonVariants>{}

export type {IButtonProps}