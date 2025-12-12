import type {IModalCompProps} from "../interface";
import style from '../style/modal.module.css'
import {useCallback, useEffect, useRef} from "react";
import {ICON_PATH} from "@shared/components/images/icons";
import Icon from "@mdi/react";

const Modal = ({
    id,
    title,
    onClose, canClose = true,
    children,
}:IModalCompProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    const handleClose = useCallback(() => {
        onClose(id)
    }, [id, onClose])

    useEffect(() => {
        const dialog = dialogRef.current
        if (dialog && !dialog.open) {
            dialog.showModal()
        }

        const handleCancel = (e: Event) => {
            e.preventDefault()
            handleClose()
        }

        dialog?.addEventListener('cancel', handleCancel)
        return () => {
            dialog?.removeEventListener('cancel', handleCancel)
        }
    }, [handleClose]);
    
    return (
        <div className={style.container}>
            <dialog
                ref={dialogRef}
                className={style.modal}
            >
                {canClose &&
                    <button className={style.closeBtn} onClick={handleClose}>
                        <Icon path={ICON_PATH.CROSS} size={1}/>
                    </button>
                }
                {title && <h1>{title}</h1>}
                {children}
            </dialog>
        </div>
    )
}

export { Modal }