import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/lib/companies-api';
import type { CompanyFilters } from '@/types/company';

export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (filters: CompanyFilters) => [...companyKeys.lists(), filters] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (slug: string) => [...companyKeys.details(), slug] as const,
};

/** Paginated company listing with optional search */
export const useCompanies = (filters: CompanyFilters = {}) =>
  useQuery({
    queryKey: companyKeys.list(filters),
    queryFn: () => companiesApi.list(filters).then((r) => r.data),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

/** Single company by slug with its active jobs */
export const useCompany = (slug: string) =>
  useQuery({
    queryKey: companyKeys.detail(slug),
    queryFn: () => companiesApi.getBySlug(slug).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!slug,
  });
