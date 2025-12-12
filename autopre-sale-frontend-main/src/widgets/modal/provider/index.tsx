import {type PropsWithChildren, useCallback, useState} from "react";
import {ModalContext} from "@widgets/modal/context";
import {Modal} from "@shared/components/modal/component";
import type {IModal, IModalShowParams} from "@widgets/modal/interface";

const ModalProvider = ({children}: PropsWithChildren) => {
    const [modals, setModals] = useState<IModal[]>([]);

    const showModal = useCallback(({content, title, canClose = true}: IModalShowParams) => {
        const id = crypto.randomUUID()
        setModals(prev => [...prev, {id, content, title, canClose}])
        return id
    }, [])

    const closeModal = useCallback((id: string) => {
        setModals(prev => prev.filter(modal => modal.id !== id))
    }, [])

    const closeAllModals = useCallback(() => {
        setModals([])
    }, [])

    return (
        <ModalContext.Provider value={{showModal, closeModal, closeAllModals}}>
            {children}
            {modals.map(({id, content, title, canClose}) => (
                <Modal
                    key={id}
                    id={id}
                    title={title}
                    onClose={closeModal}
                    canClose={canClose}
                >
                    {content}
                </Modal>
            ))}

        </ModalContext.Provider>
    )
}

export { ModalProvider }