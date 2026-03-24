import api from './api';
import type { Job, JobFilters, JobListResponse } from '@/types/jobs';

/** Strip empty/falsy values before building query string */
const cleanFilters = (filters: JobFilters): Record<string, string> => {
  const params: Record<string, string> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      params[key] = String(value);
    }
  });
  return params;
};

export const jobsApi = {
  list: (filters: JobFilters = {}): Promise<{ data: JobListResponse }> =>
    api.get('/jobs', { params: cleanFilters(filters) }),

  getByIdOrSlug: (idOrSlug: string): Promise<{ data: { job: Job } }> =>
    api.get(`/jobs/${idOrSlug}`),

  // Employer
  getMyJobs: (filters: JobFilters = {}): Promise<{ data: JobListResponse }> =>
    api.get('/jobs/employer/mine', { params: cleanFilters(filters) }),

  create: (data: object): Promise<{ data: { job: Job } }> =>
    api.post('/jobs', data),

  update: (id: string, data: object): Promise<{ data: { job: Job } }> =>
    api.put(`/jobs/${id}`, data),

  delete: (id: string): Promise<void> => api.delete(`/jobs/${id}`),
};
