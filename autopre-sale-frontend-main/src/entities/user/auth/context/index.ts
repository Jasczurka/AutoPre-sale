import {createContext} from "react";
import type {IAuthState} from "@entities/user/auth/interface";

const AuthContext = createContext<IAuthState | undefined>(undefined);

export { AuthContext };