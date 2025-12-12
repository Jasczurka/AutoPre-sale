import {useContext} from "react";
import {AlertContext} from "@widgets/alert/context";

const useAlert = () => {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error("useAlert must be used within AlertProvider");
    return ctx;
};

export { useAlert }