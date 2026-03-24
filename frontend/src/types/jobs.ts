import type { PaginationMeta } from './pagination';

export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship'] as const;
export const JOB_EXPERIENCE_LEVELS = ['entry', 'mid', 'senior'] as const;
export const JOB_STATUSES = ['active', 'paused', 'closed'] as const;
export const SALARY_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED'] as const;
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

export type JobType = (typeof JOB_TYPES)[number];
export type JobExperienceLevel = (typeof JOB_EXPERIENCE_LEVELS)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type SalaryCurrency = (typeof SALARY_CURRENCIES)[number];
export type JobCategory = (typeof JOB_CATEGORIES)[number];

export interface JobCompany {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  location?: string;
  website?: string;
  description?: string;
  size?: string;
}

export interface Job {
  _id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string;
  location: string;
  isRemote: boolean;
  type: JobType;
  category: JobCategory;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  experienceLevel: JobExperienceLevel;
  status: JobStatus;
  tags: string[];
  viewCount: number;
  applicationCount: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  companyId: JobCompany;
}

export interface JobListResponse {
  jobs: Job[];
  pagination: PaginationMeta;
}

export interface JobFilters {
  search?: string;
  category?: JobCategory | '';
  type?: JobType | '';
  experienceLevel?: JobExperienceLevel | '';
  isRemote?: boolean;
  location?: string;
  page?: number;
  limit?: number;
}
