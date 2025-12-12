import {z} from 'zod';

const searchProjectSchema = z.object({
    search: z.string().optional(),
    sortType: z.string().optional(),
})

const createProjectSchema = z.object({
    projectName: z
        .string()
        .min(3),
    clientName: z.string(),
    projectDescription: z.string().optional(),
})

const editProjectSchema = z.object({
    projectName: z
        .string()
        .min(3),
    clientName: z.string(),
    projectDescription: z.string(),
})

export {createProjectSchema, editProjectSchema, searchProjectSchema};