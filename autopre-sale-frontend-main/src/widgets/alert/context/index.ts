import {createContext} from "react";
import type {IAlertContextProps} from "@widgets/alert/interface";


const AlertContext = createContext<IAlertContextProps>({
    alerts: [],
    showAlert: () => {},
    closeAlert: () => {},
})

export {AlertContext};