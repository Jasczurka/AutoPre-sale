import type {EAlertType} from "@shared/enum/alert";

interface IAlert {
    id: string;
    message: string;
    type: EAlertType,
    visible?: boolean;
}


interface IAlertContextProps {
    alerts: IAlert[];
    showAlert: (message: string, type?: EAlertType) => void;
    closeAlert: (id: string) => void;
}

export type {
    IAlert,
    IAlertContextProps
};