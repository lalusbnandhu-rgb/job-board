import { z } from 'zod';
import { JOB_CATEGORIES, JOB_EXPERIENCE_LEVELS, JOB_TYPES } from '@/types/jobs';

export const createJobSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(150),
    description: z
      .string()
      .min(50, 'Description must be at least 50 characters')
      .max(10_000),
    requirements: z
      .string()
      .min(20, 'Requirements must be at least 20 characters')
      .max(5_000),
    location: z.string().min(2).max(100),
    isRemote: z.boolean().default(false),
    type: z.enum(JOB_TYPES, { required_error: 'Job type is required' }),
    category: z.enum(JOB_CATEGORIES, { required_error: 'Category is required' }),
    salaryMin: z.coerce.number().int().min(0).optional().or(z.literal('')),
    salaryMax: z.coerce.number().int().min(0).optional().or(z.literal('')),
    salaryCurrency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'AED']).default('USD'),
    experienceLevel: z.enum(JOB_EXPERIENCE_LEVELS, {
      required_error: 'Experience level is required',
    }),
    tags: z.string().optional(), // comma-separated on form, parsed on submit
    expiresAt: z.string().optional(),
  })
  .refine(
    (d) => {
      if (!d.salaryMin || !d.salaryMax) return true;
      return Number(d.salaryMax) >= Number(d.salaryMin);
    },
    { message: 'Max salary must be ≥ min salary', path: ['salaryMax'] },
  );

export type CreateJobFormData = z.infer<typeof createJobSchema>;
