import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employerApi } from '@/lib/employer-api';
import { jobsApi } from '@/lib/jobs-api';
import type { CompanyFormValues } from '@/types/employer';
import type { ApplicationStatus } from '@/types/seeker';
import type { Job } from '@/types/jobs';

export const employerKeys = {
  company: ['employer', 'company'] as const,
  dashboard: ['employer', 'dashboard'] as const,
  jobs: (page: number, status?: string) => ['employer', 'jobs', page, status] as const,
  job: (id: string) => ['employer', 'job', id] as const,
  applications: (jobId: string, page: number, status?: string) =>
    ['employer', 'applications', jobId, page, status] as const,
};

// ── Company ───────────────────────────────────────────────────────────────────

export const useMyCompany = () =>
  useQuery({
    queryKey: employerKeys.company,
    queryFn: () => employerApi.getCompany().then((r) => r.data.company),
    staleTime: 60_000,
  });

export const useUpsertCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CompanyFormValues) =>
      employerApi.upsertCompany(data).then((r) => r.data.company),
    onSuccess: () => qc.invalidateQueries({ queryKey: employerKeys.company }),
  });
};

export const useUploadCompanyLogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => employerApi.uploadCompanyLogo(file).then((r) => r.data.logoUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: employerKeys.company }),
  });
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const useEmployerStats = () =>
  useQuery({
    queryKey: employerKeys.dashboard,
    queryFn: () => employerApi.getDashboardStats().then((r) => r.data.stats),
    staleTime: 30_000,
  });

// ── Single job (for edit form) ─────────────────────────────────────────────────

export const useJobById = (id: string) =>
  useQuery({
    queryKey: employerKeys.job(id),
    queryFn: () => jobsApi.getByIdOrSlug(id).then((r) => r.data.job),
    enabled: !!id,
    staleTime: 30_000,
  });

// ── Create / Update / Delete job ─────────────────────────────────────────────

export const useCreateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Job>) => jobsApi.create(data).then((r) => r.data.job),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      qc.invalidateQueries({ queryKey: employerKeys.dashboard });
    },
  });
};

export const useUpdateJob = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Job>) => jobsApi.update(id, data).then((r) => r.data.job),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      qc.invalidateQueries({ queryKey: employerKeys.job(id) });
    },
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      qc.invalidateQueries({ queryKey: employerKeys.dashboard });
    },
  });
};

// ── My jobs ───────────────────────────────────────────────────────────────────

export const useMyJobs = (page = 1, status?: string) =>
  useQuery({
    queryKey: employerKeys.jobs(page, status),
    queryFn: () => employerApi.getMyJobs(page, 10, status).then((r) => r.data),
    staleTime: 30_000,
  });

// ── Job applications ──────────────────────────────────────────────────────────

export const useJobApplications = (jobId: string, page = 1, status?: ApplicationStatus) =>
  useQuery({
    queryKey: employerKeys.applications(jobId, page, status),
    queryFn: () =>
      employerApi.getJobApplications(jobId, page, 10, status).then((r) => r.data),
    enabled: !!jobId,
    staleTime: 30_000,
  });

export const useUpdateApplicationStatus = (jobId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      status,
      employerNote,
    }: {
      applicationId: string;
      status: ApplicationStatus;
      employerNote?: string;
    }) => employerApi.updateApplicationStatus(applicationId, status, employerNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employer', 'applications', jobId] });
      qc.invalidateQueries({ queryKey: employerKeys.dashboard });
    },
  });
};
