import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  users: (page: number, role?: string, search?: string) =>
    ['admin', 'users', page, role, search] as const,
  jobs: (page: number, status?: string, search?: string) =>
    ['admin', 'jobs', page, status, search] as const,
  applications: (page: number, status?: string, jobId?: string, seekerId?: string) =>
    ['admin', 'applications', page, status, jobId, seekerId] as const,
};

export const useAdminStats = () =>
  useQuery({
    queryKey: adminKeys.stats,
    queryFn: () => adminApi.getStats().then((r) => r.data.stats),
    staleTime: 30_000,
  });

export const useAdminUsers = (page = 1, role?: string, search?: string) =>
  useQuery({
    queryKey: adminKeys.users(page, role, search),
    queryFn: () => adminApi.listUsers({ page, limit: 20, role, search }).then((r) => r.data),
    staleTime: 30_000,
  });

export const useBanUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ban }: { id: string; ban: boolean }) =>
      ban ? adminApi.banUser(id) : adminApi.unbanUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
};

export const useAdminJobs = (page = 1, status?: string, search?: string) =>
  useQuery({
    queryKey: adminKeys.jobs(page, status, search),
    queryFn: () => adminApi.listJobs({ page, limit: 20, status, search }).then((r) => r.data),
    staleTime: 30_000,
  });

export const useAdminDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
};

export const useAdminApplications = (page = 1, status?: string) =>
  useQuery({
    queryKey: adminKeys.applications(page, status),
    queryFn: () =>
      adminApi.listApplications({ page, limit: 20, status }).then((r) => r.data),
    staleTime: 30_000,
  });
