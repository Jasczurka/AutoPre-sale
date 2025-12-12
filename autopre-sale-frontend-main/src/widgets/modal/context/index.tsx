import {createContext} from "react";
import type {IModalContextProps} from "@widgets/modal/interface";

const ModalContext = createContext<IModalContextProps|undefined>(undefined)

export { ModalContext }