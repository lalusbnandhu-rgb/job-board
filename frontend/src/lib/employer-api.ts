import api from './api';
import type { Company, EmployerStats, EmployerApplicationListResponse, CompanyFormValues } from '@/types/employer';
import type { JobListResponse } from '@/types/jobs';
import type { ApplicationStatus } from '@/types/seeker';

export const employerApi = {
  // ── Company ───────────────────────────────────────────────────────────────

  getCompany: (): Promise<{ data: { company: Company | null } }> =>
    api.get('/employer/company'),

  upsertCompany: (data: CompanyFormValues): Promise<{ data: { company: Company } }> =>
    api.put('/employer/company', data),

  uploadCompanyLogo: (file: File): Promise<{ data: { logoUrl: string } }> => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/employer/company/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────

  getDashboardStats: (): Promise<{ data: { stats: EmployerStats } }> =>
    api.get('/employer/dashboard'),

  // ── My jobs ───────────────────────────────────────────────────────────────

  getMyJobs: (
    page = 1,
    limit = 10,
    status?: string,
  ): Promise<{ data: JobListResponse }> =>
    api.get('/employer/jobs', { params: { page, limit, status } }),

  // ── Job applications ──────────────────────────────────────────────────────

  getJobApplications: (
    jobId: string,
    page = 1,
    limit = 10,
    status?: ApplicationStatus,
  ): Promise<{ data: EmployerApplicationListResponse }> =>
    api.get(`/employer/jobs/${jobId}/applications`, { params: { page, limit, status } }),

  updateApplicationStatus: (
    applicationId: string,
    status: ApplicationStatus,
    employerNote?: string,
  ): Promise<{ data: { message: string } }> =>
    api.patch(`/employer/applications/${applicationId}/status`, { status, employerNote }),
};
