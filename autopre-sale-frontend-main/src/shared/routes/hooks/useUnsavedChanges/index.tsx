// hooks/use-unsaved-changes.ts
import { useEffect } from 'react';

export const useUnsavedChanges = (hasUnsavedChanges: boolean) => {
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);
};