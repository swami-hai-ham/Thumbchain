import z from 'zod'

export const createTaskInput = z.object({
    options: z.array(z.object({
        imageUrl: z.string()
    })),
    title: z.string().optional(),
    signature: z.string(),
    country: z.string().optional().nullable()
})

export const createSubmissionInput = z.object({
    taskId: z.string(),
    selection: z.string()
})