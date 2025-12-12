import type {EProjectStatus} from "@shared/enum/project";

interface ICreateProjectPort {
    name: string;
    clientName: string;
    status?: EProjectStatus;
    description?: string;
}

interface IEditProjectPort {
    id: string;
    name: string;
    clientName: string;
    status?: EProjectStatus;
    description?: string;
}

export type {
    ICreateProjectPort,
    IEditProjectPort
}