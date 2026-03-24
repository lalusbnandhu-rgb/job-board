import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seekerApi } from '@/lib/seeker-api';

export const seekerKeys = {
  profile: ['seeker', 'profile'] as const,
  savedJobs: (page: number) => ['seeker', 'saved-jobs', page] as const,
};

export const useProfile = () =>
  useQuery({
    queryKey: seekerKeys.profile,
    queryFn: () => seekerApi.getProfile().then((r) => r.data.profile),
    staleTime: 60_000,
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => seekerApi.updateProfile(data).then((r) => r.data.profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: seekerKeys.profile }),
  });
};

export const useUploadAvatar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => seekerApi.uploadAvatar(file).then((r) => r.data.avatarUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: seekerKeys.profile }),
  });
};

export const useUploadResume = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => seekerApi.uploadResume(file).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: seekerKeys.profile }),
  });
};

export const useSavedJobs = (page = 1) =>
  useQuery({
    queryKey: seekerKeys.savedJobs(page),
    queryFn: () => seekerApi.getSavedJobs(page).then((r) => r.data),
    staleTime: 30_000,
  });

export const useSaveJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => seekerApi.saveJob(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seeker', 'saved-jobs'] }),
  });
};

export const useUnsaveJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => seekerApi.unsaveJob(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seeker', 'saved-jobs'] }),
  });
};
