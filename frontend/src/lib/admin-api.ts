import api from './api';
import type { PlatformStats, AdminUserListResponse, AdminJobListResponse, AdminApplicationListResponse } from '@/types/admin';

export const adminApi = {
  getStats: (): Promise<{ data: { stats: PlatformStats } }> =>
    api.get('/admin/stats'),

  listUsers: (params: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<{ data: AdminUserListResponse }> =>
    api.get('/admin/users', { params }),

  banUser: (id: string): Promise<{ data: { message: string } }> =>
    api.patch(`/admin/users/${id}/ban`),

  unbanUser: (id: string): Promise<{ data: { message: string } }> =>
    api.patch(`/admin/users/${id}/unban`),

  listJobs: (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ data: AdminJobListResponse }> =>
    api.get('/admin/jobs', { params }),

  deleteJob: (id: string): Promise<void> =>
    api.delete(`/admin/jobs/${id}`),

  listApplications: (params: {
    page?: number;
    limit?: number;
    status?: string;
    jobId?: string;
    seekerId?: string;
  }): Promise<{ data: AdminApplicationListResponse }> =>
    api.get('/admin/applications', { params }),
};
