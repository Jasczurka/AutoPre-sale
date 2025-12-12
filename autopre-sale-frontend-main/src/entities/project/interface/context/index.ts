interface ProjectData {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

interface ProjectState {
    projectId: string;
    projectData: ProjectData | null;
    isLoading: boolean;
    error: string | null;
}


interface ProjectContextType {
    state: ProjectState;
    setProjectData: (data: ProjectData) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    refreshProject: () => void;
}

export type {
    ProjectData,
    ProjectState,
    ProjectContextType
}