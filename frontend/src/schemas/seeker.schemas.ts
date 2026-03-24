import { z } from 'zod';
import { JOB_EXPERIENCE_LEVELS } from '@/types/jobs';

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  headline: z.string().max(120).optional().or(z.literal('')),
  bio: z.string().max(1000).optional().or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
  skills: z.array(z.string().max(40)).max(30).default([]),
  experienceLevel: z.enum(JOB_EXPERIENCE_LEVELS).optional().or(z.literal('')),
});

export const applySchema = z.object({
  coverLetter: z
    .string()
    .min(50, 'Cover letter must be at least 50 characters')
    .max(3000, 'Cover letter cannot exceed 3000 characters'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type ApplyFormData = z.infer<typeof applySchema>;
