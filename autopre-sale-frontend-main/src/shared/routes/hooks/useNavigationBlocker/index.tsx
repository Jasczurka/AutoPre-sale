// hooks/use-navigation-blocks.ts
import { useCallback, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import {useModal} from "@widgets/modal/use-case";
import {UnsavedChangesModal} from "@shared/routes/model/unsavedChangesModal";

export const useNavigationBlocker = (hasUnsavedChanges: boolean) => {
    const router = useRouter();
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const {showModal, closeAllModals} = useModal()

    const confirmNavigation = useCallback(() => {
        if (pendingNavigation) {
            closeAllModals();
            router.navigate({ to: pendingNavigation });
            setPendingNavigation(null);
        }
    }, [closeAllModals, pendingNavigation, router]);

    const cancelNavigation = useCallback(() => {
        closeAllModals();
        setPendingNavigation(null);
    }, [closeAllModals]);

    const blockNavigation = useCallback((to: string) => {
        if (hasUnsavedChanges) {
            setPendingNavigation(to);
            showModal(UnsavedChangesModal({onConfirm: confirmNavigation, onCancel: cancelNavigation}))
            return false;
        }
        return true;
    }, [cancelNavigation, confirmNavigation, hasUnsavedChanges, showModal]);

    return {
        showModal,
        blockNavigation,
        confirmNavigation,
        cancelNavigation
    };
};