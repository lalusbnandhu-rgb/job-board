import api from './api';
import type { CompanyListResponse, CompanyFilters, CompanyDetail } from '@/types/company';
import type { Job } from '@/types/jobs';

const cleanFilters = (filters: CompanyFilters): Record<string, string> => {
  const params: Record<string, string> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      params[key] = String(value);
    }
  });
  return params;
};

export const companiesApi = {
  list: (filters: CompanyFilters = {}): Promise<{ data: CompanyListResponse }> =>
    api.get('/companies', { params: cleanFilters(filters) }),

  getBySlug: (slug: string): Promise<{ data: { company: CompanyDetail; jobs: Job[] } }> =>
    api.get(`/companies/${slug}`),
};
