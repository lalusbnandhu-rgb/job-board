import api from './api';
import type { SeekerProfile, ApplicationListResponse, SavedJobsResponse } from '@/types/seeker';
import type { Application } from '@/types/seeker';

export const seekerApi = {
  // Profile
  getProfile: (): Promise<{ data: { profile: SeekerProfile | null } }> =>
    api.get('/seeker/profile'),

  updateProfile: (data: object): Promise<{ data: { profile: SeekerProfile } }> =>
    api.put('/seeker/profile', data),

  uploadAvatar: (file: File): Promise<{ data: { avatarUrl: string } }> => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/seeker/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadResume: (file: File): Promise<{ data: { resumeUrl: string; resumeFileName: string } }> => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/seeker/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteResume: (): Promise<void> => api.delete('/seeker/resume'),

  // Saved jobs
  getSavedJobs: (page = 1, limit = 10): Promise<{ data: SavedJobsResponse }> =>
    api.get('/seeker/saved-jobs', { params: { page, limit } }),

  saveJob: (jobId: string): Promise<void> => api.post(`/seeker/saved-jobs/${jobId}`),

  unsaveJob: (jobId: string): Promise<void> => api.delete(`/seeker/saved-jobs/${jobId}`),
};

export const applicationApi = {
  apply: (jobId: string, coverLetter: string): Promise<{ data: { application: Application } }> =>
    api.post('/applications', { jobId, coverLetter }),

  getMyApplications: (
    page = 1,
    limit = 10,
    status?: string,
  ): Promise<{ data: ApplicationListResponse }> =>
    api.get('/applications/mine', { params: { page, limit, status } }),

  checkApplied: (jobId: string): Promise<{ data: { applied: boolean } }> =>
    api.get(`/applications/check/${jobId}`),
};
