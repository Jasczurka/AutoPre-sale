import {useContext} from "react";
import {AuthContext} from "@entities/user/auth/context/index.ts";

function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export {useAuth}