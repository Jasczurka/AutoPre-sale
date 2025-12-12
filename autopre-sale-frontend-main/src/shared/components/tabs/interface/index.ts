import type {ReactNode} from "react";

interface ITabsProps {
    tabs: {
        label: string;
        content: ReactNode,
        aria: string }[],
    className?: string;
}

interface ITabProps {
    label: string,
    onClick:()=>void,
    active?:boolean,
    aria: string,
}

export type {ITabProps, ITabsProps}