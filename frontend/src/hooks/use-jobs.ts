import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/jobs-api';
import type { JobFilters } from '@/types/jobs';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  myJobs: (filters: JobFilters) => ['my-jobs', filters] as const,
};

/** Public job listing with filters */
export const useJobs = (filters: JobFilters = {}) =>
  useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => jobsApi.list(filters).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep previous data while fetching next page
  });

/** Single job by ID or slug */
export const useJob = (idOrSlug: string) =>
  useQuery({
    queryKey: jobKeys.detail(idOrSlug),
    queryFn: () => jobsApi.getByIdOrSlug(idOrSlug).then((r) => r.data.job),
    staleTime: 60_000,
    enabled: !!idOrSlug,
  });

/** Employer's own posted jobs */
export const useMyJobs = (filters: JobFilters = {}) =>
  useQuery({
    queryKey: jobKeys.myJobs(filters),
    queryFn: () => jobsApi.getMyJobs(filters).then((r) => r.data),
    staleTime: 30_000,
  });

/** Delete a job mutation */
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
    },
  });
};
