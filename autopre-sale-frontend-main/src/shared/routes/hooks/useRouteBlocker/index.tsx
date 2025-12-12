import { useRouter } from '@tanstack/react-router';
import {useEffect, useRef} from "react";

export const useRouteBlocker = (
    hasUnsavedChanges: boolean,
    message?: string
) => {
    const router = useRouter();
    const isBlockingRef = useRef(false);

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        // Только обработчик кликов по ссылкам
        const handleClick = (e: MouseEvent) => {
            if (isBlockingRef.current) return;

            const link = (e.target as Element).closest('a[href]');
            if (link && link.getAttribute('href')?.startsWith('/')) {
                const href = link.getAttribute('href');
                if (!href) return;

                // Проверяем, это внешняя навигация или нет
                if (href !== window.location.pathname) {
                    e.preventDefault();
                    e.stopPropagation();

                    const shouldNavigate = window.confirm(
                        message || 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?'
                    );

                    if (shouldNavigate) {
                        router.navigate({ to: href });
                    }
                }
            }
        };

        document.addEventListener('click', handleClick, true);

        return () => {
            document.removeEventListener('click', handleClick, true);
        };
    }, [hasUnsavedChanges, message, router]);
};