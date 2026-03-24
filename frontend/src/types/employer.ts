import type { PaginationMeta } from './pagination';
import type { ApplicationStatus } from './seeker';

// ── Company ───────────────────────────────────────────────────────────────────

export const COMPANY_SIZES = ['startup', 'small', 'medium', 'large', 'enterprise'] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export interface Company {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  location?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Employer dashboard stats ───────────────────────────────────────────────────

export interface EmployerStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
}

// ── Seeker profile (minimal — shown on applicant cards) ───────────────────────

export interface ApplicantProfile {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  headline?: string;
}

// ── Enriched application returned by employer endpoints ───────────────────────

export interface EmployerApplication {
  _id: string;
  jobId: string;
  seekerId: { _id: string; email: string } | string;
  coverLetter: string;
  resumeUrl: string;
  status: ApplicationStatus;
  employerNote?: string;
  seekerProfile: ApplicantProfile | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerApplicationListResponse {
  applications: EmployerApplication[];
  pagination: PaginationMeta;
}

// ── Company form values ────────────────────────────────────────────────────────

export interface CompanyFormValues {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: CompanySize | '';
  location?: string;
}
