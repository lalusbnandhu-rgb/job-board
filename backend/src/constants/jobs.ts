export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_EXPERIENCE_LEVELS = ['entry', 'mid', 'senior'] as const;
export type JobExperienceLevel = (typeof JOB_EXPERIENCE_LEVELS)[number];

export const JOB_STATUSES = ['active', 'paused', 'closed'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_CATEGORIES = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'Legal',
  'HR',
  'Customer Support',
  'Data & Analytics',
  'DevOps',
  'Security',
  'Other',
] as const;
export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const SALARY_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED'] as const;
export type SalaryCurrency = (typeof SALARY_CURRENCIES)[number];

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
