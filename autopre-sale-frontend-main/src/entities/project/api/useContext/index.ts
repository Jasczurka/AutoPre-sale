import {useContext} from "react";
import {ProjectContext} from "@entities/project/api/context";

export const useProjectContext = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProjectContext must be used within ProjectProvider');
    }
    return context;
};