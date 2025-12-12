import {EAlertType} from "@shared/enum/alert";
import type {IAlertProps} from "@shared/components/alert/interface";
import {ICON_PATH} from "@shared/components/images/icons";
import {cn} from "@shared/lib/cn";
import {alertVariants} from "@shared/components/alert/style";
import Icon from "@mdi/react";

const ICON_MAP = {
    success: ICON_PATH.ALERT_SUCCESS,
    error: ICON_PATH.ALERT_ERROR,
    info: ICON_PATH.ALERT_INFO,
    warning: ICON_PATH.ALERT_WARNING
} as const satisfies Readonly<Record<EAlertType, string>>

const Alert = ({
                   id,
                   message,
                   type = EAlertType.INFO,
                   onClose,
                   visible,
                   className,
                   ...props
}: IAlertProps) => {
    const icon = ICON_MAP[type]
    return (
        <div className={cn(alertVariants({ type, visible }), className)} {...props}>
            <div className="flex items-center gap-4">
                <div className="h-6 w-6">
                    <Icon
                    path={icon}
                    size={1} />
                </div>
                {message}
            </div>
            <button
                onClick={() => onClose(id)}
            >
                <Icon path={ICON_PATH.CROSS} size={1} />
            </button>
        </div>
    )
}

export {Alert}

