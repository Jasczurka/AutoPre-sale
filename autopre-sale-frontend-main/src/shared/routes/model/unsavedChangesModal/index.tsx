// widgets/unsaved-changes-modal/ui/index.tsx
import { Button } from '@/shared/components/form/button';
import type {IModalShowParams} from "@widgets/modal/interface";

interface UnsavedChangesModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message?: string;
}

export const UnsavedChangesModal = ({
    onConfirm,
    onCancel,
    title = 'У вас есть несохраненные изменения. Вы уверены, что хотите уйти?',
    message
}: UnsavedChangesModalProps) : IModalShowParams => {
    return {
        title: title,
        content: (
            <div className="space-y-4">
                {message && <p>{message}</p>}
                <div className="flex gap-2 justify-end">
                    <Button outline onClick={onCancel}>
                        Остаться
                    </Button>
                    <Button onClick={onConfirm}>
                        Уйти
                    </Button>
                </div>
            </div>
        ),
        canClose: false,
    }
};