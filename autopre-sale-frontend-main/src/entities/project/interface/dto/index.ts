import type {EProjectStatus} from "@shared/enum/project";

interface IProjectDto {
    id: string;
    name: string;
    clientName: string;
    status: EProjectStatus;
    description?: string;
    documents?: IProjectDocumentDto[]
    createdAt: string;
    updatedAt: string;
}

interface IProjectDocumentDto {
    id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    processed: boolean;
}

export type {
    IProjectDto,
    IProjectDocumentDto
}