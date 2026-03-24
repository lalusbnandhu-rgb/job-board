import type { Job } from './jobs';
import type { PaginationMeta } from './pagination';

export type ApplicationStatus = 'applied' | 'reviewed' | 'shortlisted' | 'rejected';

export interface SeekerProfile {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: string[];
  experienceLevel?: 'entry' | 'mid' | 'senior';
  resumeUrl?: string;
  resumeFileName?: string;
  savedJobs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  _id: string;
  jobId: Job | string;
  seekerId: string;
  coverLetter: string;
  resumeUrl: string;
  status: ApplicationStatus;
  employerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationListResponse {
  applications: Application[];
  pagination: PaginationMeta;
}

export interface SavedJobsResponse {
  jobs: Job[];
  pagination: PaginationMeta;
}
