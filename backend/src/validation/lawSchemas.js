import { z } from 'zod';

const isoDate = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid date' })
  .transform((val) => new Date(val));

export const getLawsQuerySchema = z.object({
  q: z.string().trim().default(''),
  wordField: z.enum(['title', 'text', 'code']).default('title'),
  sortBy: z.enum(['date', 'title']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.string().trim().optional(),
  documentType: z.string().trim().optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
});

export const formatZodError = (error) => {
  const issue = error.issues[0];
  const field = issue.path.length ? issue.path[0] : 'query';
  return `${field}: ${issue.message}`;
};
