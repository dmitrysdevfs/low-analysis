import { z } from 'zod';
import { formatZodError } from './lawSchemas.js';

const isoDate = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid date' })
  .transform((val) => new Date(val));

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'q is required'),
  type: z.enum(['law', 'article', 'all']).default('all'),
  status: z.string().trim().optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export { formatZodError };
