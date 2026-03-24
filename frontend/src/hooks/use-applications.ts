import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '@/lib/seeker-api';

export const applicationKeys = {
  mine: (page: number, status?: string) => ['applications', 'mine', page, status] as const,
  check: (jobId: string) => ['applications', 'check', jobId] as const,
};

export const useMyApplications = (page = 1, status?: string) =>
  useQuery({
    queryKey: applicationKeys.mine(page, status),
    queryFn: () => applicationApi.getMyApplications(page, 10, status).then((r) => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

export const useCheckApplied = (jobId: string) =>
  useQuery({
    queryKey: applicationKeys.check(jobId),
    queryFn: () => applicationApi.checkApplied(jobId).then((r) => r.data.applied),
    enabled: !!jobId,
    staleTime: 60_000,
  });

export const useApplyToJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, coverLetter }: { jobId: string; coverLetter: string }) =>
      applicationApi.apply(jobId, coverLetter).then((r) => r.data.application),
    onSuccess: (_data, { jobId }) => {
      qc.invalidateQueries({ queryKey: ['applications', 'mine'] });
      qc.invalidateQueries({ queryKey: applicationKeys.check(jobId) });
    },
  });
};
