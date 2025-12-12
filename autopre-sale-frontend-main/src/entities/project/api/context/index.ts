import {createContext} from "react";
import type {ProjectContextType} from "@entities/project/interface/context";

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export {ProjectContext}