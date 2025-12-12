import type {ComponentProps} from "react";
import type {VariantProps} from "class-variance-authority";
import {buttonVariants} from "@shared/components/form/button";

interface IInputFileProps
    extends ComponentProps<'input'>,
        VariantProps<typeof buttonVariants> {}

export type {IInputFileProps}