import type {PropsWithChildren} from "react";

interface IModalCompProps
    extends PropsWithChildren
{
    id: string;
    title?: string;
    onClose: (id: string) => void;
    canClose?: boolean;
}

export type { IModalCompProps };