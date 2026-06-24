import { z } from 'zod';
import { formatZodError } from './lawSchemas.js';

const isoDate = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid date' })
  .transform((val) => new Date(val));

export const searchQuerySchema = z
  .object({
    q: z.string().trim().min(1).optional(),
    type: z.enum(['law', 'article', 'all']).default('all'),
    status: z.string().trim().optional(),
    dateFrom: isoDate.optional(),
    dateTo: isoDate.optional(),
    subjectId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'subjectId must be a valid id')
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((data) => Boolean(data.q) || Boolean(data.subjectId), {
    message: 'q or subjectId is required',
    path: ['q'],
  });

export { formatZodError };
