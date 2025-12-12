import React, {useEffect} from "react";
import {useNavigationBlocker} from "@shared/routes/hooks/useNavigationBlocker";

export const withUnsavedGuard = <P extends object>(
    Component: React.ComponentType<P>,
    hasUnsavedChanges: boolean
) => {
    return (props: P) => {
        const { blockNavigation } = useNavigationBlocker(hasUnsavedChanges);
        // Блокировка навигации по ссылкам
        useEffect(() => {
            const handleClick = (e: MouseEvent) => {
                const link = (e.target as Element).closest('a');
                if (link && link.href) {
                    e.preventDefault();
                    blockNavigation(link.href);
                }
            };

            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }, [blockNavigation]);

        return (
            <>
                <Component {...props} />
            </>
        );
    };
};