import { createContext, useContext } from "react";

interface SidebarLayoutContextProps {
    title: string;
    setTitle: (value: string) => void;
}

export const SidebarLayoutContext = createContext<SidebarLayoutContextProps | null>(null);

export const useSidebarLayout = () => {
    const context = useContext(SidebarLayoutContext);
    if (!context) {
        throw new Error("useSidebarLayout must be used within a SidebarLayoutProvider");
    }
    return context;
};
