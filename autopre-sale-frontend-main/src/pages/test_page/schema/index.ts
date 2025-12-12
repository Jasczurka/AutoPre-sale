
import {z} from 'zod';

const testPageSchema = z.object({
    input: z
        .string()
        .min(3)
        .max(10)
})

export {testPageSchema};