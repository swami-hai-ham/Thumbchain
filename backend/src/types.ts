import z from 'zod'

export const createTaskInput = z.object({
    options: z.array(z.object({
        imageUrl: z.string()
    })),
    title: z.string().optional(),
    signature: z.string(),
    country: z.string().optional().nullable(),
    responsesNeeded: z.number().min(100).max(1000)
})

export const createSubmissionInput = z.object({
    taskId: z.string(),
    selection: z.string()
})

export const bufferSchema = z.object({
    type: z.literal('Buffer'), 
    data: z.array(z.number().int().min(0).max(255)) 
  });

export const signinBodySchema = z.object({
    signature: bufferSchema, 
    publicKey: z
      .string()
      .min(44, 'Public key must be at least 44 characters long')
      .max(44, 'Public key must be at most 44 characters long')
      .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid base58 string'), 
    message: z
      .string()
      .min(1, 'Message cannot be empty') 
      .max(500, 'Message is too long')   
  });

export const checkTxnSchema = z.object({
  signature: z.string()
})