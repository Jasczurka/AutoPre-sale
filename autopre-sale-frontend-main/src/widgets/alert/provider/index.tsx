import {type PropsWithChildren, useCallback, useState} from "react";
import {AlertContext} from "@widgets/alert/context";
import type {IAlert} from "@widgets/alert/interface";
import type {EAlertType} from "@shared/enum/alert";
import {ALERT_DISPLAY_TIME, ALERT_FADE_TIME} from "@widgets/alert/const";
import {Alert} from "@shared/components/alert/component";

const AlertProvider = ({children}: PropsWithChildren) => {
    const [alerts, setAlerts] = useState<IAlert[]>([])

    const closeAlert = useCallback((id: string) => {
        setAlerts(prev =>
            prev.map(alert =>
                alert.id === id ? { ...alert, visible: false } : alert
            )
        );
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, ALERT_FADE_TIME);
    }, []);

    const showAlert = useCallback((message: string, type: EAlertType)=>{
        const id = crypto.randomUUID()

        setAlerts(prev => [...prev, {id, message, type, visible: true}])

        setTimeout(() => {
            closeAlert(id)
        }, ALERT_DISPLAY_TIME-ALERT_FADE_TIME);
    }, [closeAlert])


    return (
        <AlertContext.Provider value={{alerts, showAlert, closeAlert}}>
            {children}
            <div className={'fixed bottom-4 right-4 flex flex-col gap-4 z-[9999]'}>
                {alerts.map(alert => <Alert key={alert.id} {...alert } onClose={closeAlert}/>)}
            </div>
        </AlertContext.Provider>
    )
}

export { AlertProvider }