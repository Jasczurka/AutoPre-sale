import type { ReactNode } from 'react'

interface IModalShowParams {
    content: ReactNode
    title?: string
    canClose?: boolean
}

interface IModalContextProps {
    showModal: (params: IModalShowParams) => string
    closeModal: (id: string) => void
    closeAllModals: () => void
}

interface IModal {
    id: string
    title?: string
    content: ReactNode,
    canClose?: boolean
}

export type { IModalShowParams, IModalContextProps, IModal }
