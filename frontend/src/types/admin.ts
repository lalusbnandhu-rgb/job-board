import type { PaginationMeta } from './pagination';

export interface PlatformStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  activeJobs: number;
  newUsersToday: number;
  newJobsToday: number;
  usersByRole: { seeker: number; employer: number; admin: number };
}

export interface AdminUser {
  _id: string;
  email: string;
  role: 'seeker' | 'employer' | 'admin';
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AdminJob {
  _id: string;
  title: string;
  slug: string;
  location: string;
  type: string;
  category: string;
  status: string;
  applicationCount: number;
  createdAt: string;
  companyId: { name: string; logo?: string } | null;
}

export interface AdminApplication {
  _id: string;
  status: 'applied' | 'reviewed' | 'shortlisted' | 'rejected';
  createdAt: string;
  seekerId: { _id: string; email: string } | null;
  jobId: {
    _id: string;
    title: string;
    slug: string;
    companyId: { name: string } | null;
  } | null;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: PaginationMeta;
}

export interface AdminJobListResponse {
  jobs: AdminJob[];
  pagination: PaginationMeta;
}

export interface AdminApplicationListResponse {
  applications: AdminApplication[];
  pagination: PaginationMeta;
}
