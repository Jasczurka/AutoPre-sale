// pages/project_page/contexts/ProjectContext.tsx
import React, { useReducer, useEffect } from 'react';
import type {ProjectData, ProjectState} from "@entities/project/interface/context";
import { ProjectContext } from '@/entities/project/api/context';

// Reducer для управления состоянием проекта
type ProjectAction =
    | { type: 'SET_PROJECT_DATA'; payload: ProjectData | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'REFRESH_PROJECT' };

const projectReducer = (state: ProjectState, action: ProjectAction): ProjectState => {
    switch (action.type) {
        case 'SET_PROJECT_DATA':
            return {
                ...state,
                projectData: action.payload || null,
                isLoading: false,
                error: null
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                isLoading: false
            };
        case 'REFRESH_PROJECT':
            return {
                ...state,
                isLoading: true,
                error: null
            };
        default:
            return state;
    }
};

export const ProjectProvider: React.FC<{ children: React.ReactNode; projectId: string }> = ({
    children,
    projectId
}) => {
    //const {
    //    data: projectData,
    //    isLoading,
    //    error,
    //    refetch,
    //} = useProjectQuery(projectId);

    const [state, dispatch] = useReducer(projectReducer, {
        projectId,
        projectData: null,
        isLoading: true,
        error: null,
    });

    const setProjectData = (data: ProjectData) => {
        dispatch({ type: 'SET_PROJECT_DATA', payload: data });
    };

    const setLoading = (loading: boolean) => {
        dispatch({ type: 'SET_LOADING', payload: loading });
    };

    const setError = (error: string | null) => {
        dispatch({ type: 'SET_ERROR', payload: error });
    };

    const refreshProject = () => {
        dispatch({ type: 'REFRESH_PROJECT' });
    };

    // При смене projectId сбрасываем состояние
    useEffect(() => {
        dispatch({
            type: 'SET_PROJECT_DATA',
            payload: null
        });
        dispatch({
            type: 'SET_LOADING',
            payload: true
        });
        dispatch({
            type: 'SET_ERROR',
            payload: null
        });
    }, [projectId]);

    return (
        <ProjectContext.Provider value={{
            state,
            setProjectData,
            setLoading,
            setError,
            refreshProject
        }}>
            {children}
        </ProjectContext.Provider>
    );
};